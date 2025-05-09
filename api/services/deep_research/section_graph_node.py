import os
import asyncio
import logging
from typing import List, Any

import tiktoken
from pydantic import Field, create_model
from langgraph.graph import StateGraph, START, END
from langchain_core.messages import SystemMessage, HumanMessage

from services.deep_research.stats import SectionState
from services.deep_research.llm import gpt_4
from services.deep_research.prompts import (
    REPORT_PLANNER_QUERY_WRITER_INSTRUCTIONS,
    QUERY_PROMPT_FOR_ITERATION,
)
from services.deep_research.process_node import (
    parallel_excel_search,
    parallel_web_search,
    parallel_kb_query,
)


# Configure logger
logger = logging.getLogger(__name__)

# Tokenization constants
encoder = tiktoken.encoding_for_model("gpt-4o-mini")
MAX_TOKENS = 40000

# Environment constants
KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID", "my-knowledge-base")
MODEL_ARN = os.getenv("MODEL_ARN", "arn:aws:bedrock:my-model")


def trim_to_tokens(text: str, max_tokens: int = MAX_TOKENS) -> str:
    """Safely truncate text by token count."""
    tokens = encoder.encode(text)
    if len(tokens) <= max_tokens:
        return text
    return encoder.decode(tokens[:max_tokens])


async def node_section_data_needs(state: SectionState) -> SectionState:
    """Determine which queries are needed for this section using LLM."""
    logger.debug(
        "Generating queries for section '%s' (web=%s, kb=%s, excel=%s)",
        state.title,
        state.web_research,
        state.kb_search,
        state.excel_search,
    )

    # Build dynamic model for the queries
    fields = {}
    if state.web_research:
        fields["web_queries"] = (
            List[str],
            Field(default_factory=list, description="Web queries"),
        )
    if state.kb_search:
        fields["kb_queries"] = (
            List[str],
            Field(default_factory=list, description="KB queries"),
        )
    if state.excel_search:
        fields["excel_queries"] = (
            List[str],
            Field(default_factory=list, description="Excel queries"),
        )
    if not fields:
        return state

    DynamicQueries = create_model("DynamicQueries", **fields)

    # Format base prompt with topic only
    base = REPORT_PLANNER_QUERY_WRITER_INSTRUCTIONS[state.report_type]
    prompt = base.format(topic=state.report_state.topic)

    # Append iteration-specific instructions, formatting its placeholders
    iteration_tmpl = QUERY_PROMPT_FOR_ITERATION[state.report_type]
    iteration = iteration_tmpl.format(
        section_title=state.title,
        description=state.description,
        previous_queries="\n".join(
            state.web_queries + state.kb_queries + state.excel_queries
        ),
        previous_responses=state.content or "No responses yet",
        feedback=getattr(state, "feedback", "No specific feedback"),
        tags="",
    )
    prompt += "\n" + iteration

    prompt = trim_to_tokens(prompt)

    # Invoke LLM for query generation
    structured_llm = gpt_4.with_structured_output(
        DynamicQueries, method="function_calling"
    )
    try:
        queries_obj = await structured_llm.ainvoke(
            [
                SystemMessage(content="Generate structured queries for this section."),
                HumanMessage(content=prompt),
            ]
        )

        # Collect up to 5 per source
        if state.web_research:
            state.web_queries = (getattr(queries_obj, "web_queries", []) or [])[:5]
        if state.kb_search:
            state.kb_queries = (getattr(queries_obj, "kb_queries", []) or [])[:5]
        if state.excel_search:
            state.excel_queries = (getattr(queries_obj, "excel_queries", []) or [])[:5]

    except Exception as e:
        logger.error("Query generation failed for '%s': %s", state.title, e)
        # Fallback static queries
        if state.web_research:
            state.web_queries = [
                f"Latest data for {state.title}",
                f"Trends impacting {state.title}",
                f"Peer comparisons for {state.title}",
                f"Regulatory updates on {state.title}",
                f"News about {state.title}",
            ]
        if state.kb_search:
            state.kb_queries = [
                f"Internal reports on {state.title}",
                f"Historical docs on {state.title}",
                f"Analyst notes for {state.title}",
                f"Strategic memos mentioning {state.title}",
                f"Archived KPIs for {state.title}",
            ]
        if state.excel_search:
            state.excel_queries = [
                f"{state.title} revenue by year",
                f"{state.title} margin trends",
                f"{state.title} balance sheet metrics",
                f"{state.title} capex vs opex",
                f"{state.title} regional sales",
            ]

    logger.debug(
        "Final queries for '%s': web=%s, kb=%s, excel=%s",
        state.title,
        state.web_queries,
        state.kb_queries,
        state.excel_queries,
    )
    return state


async def node_parallel_search(state: SectionState) -> SectionState:
    """Run all enabled searches concurrently."""
    logger.debug("Running parallel searches for section '%s'", state.title)
    tasks = []
    if state.excel_queries:
        tasks.append(parallel_excel_search(state.report_state, state.excel_queries))
    if state.web_queries:
        tasks.append(parallel_web_search(state.report_state, state.web_queries))
    if state.kb_queries:
        tasks.append(parallel_kb_query(state.report_state, state.kb_queries))

    results = await asyncio.gather(*tasks, return_exceptions=True)
    for res in results:
        if isinstance(res, Exception):
            logger.error("Search task error: %s", res)
            continue
        state.citations.extend(res.citations)
        state.context.append(res.context_text)
    return state


def node_merge_section_data(state: SectionState) -> SectionState:
    """Merge all search results into the section context"""
    logger.debug("Merging data for section '%s'", state.title)

    def ensure_list(x: Any) -> List[Any]:
        if x is None:
            return []
        return x if isinstance(x, list) else [x]

    web = ensure_list(state.web_results)
    kb = ensure_list(state.kb_results)
    excel = ensure_list(state.excel_results)
    ctx = ensure_list(state.context)

    # Flatten context
    flat_ctx = []
    for c in ctx:
        if isinstance(c, list):
            flat_ctx.extend(c)
        else:
            flat_ctx.append(c)

    # Combine citations and text
    all_cites = list(state.citations)
    parts = []
    for block in web + kb + excel:
        if hasattr(block, "citations"):
            all_cites.extend(block.citations)
        parts.append(getattr(block, "context_text", ""))

    state.context = "\n\n---\n\n".join(flat_ctx)
    state.citations = all_cites
    state.content = "\n\n".join(parts)
    return state


def create_section_subgraph():
    sub = StateGraph(state_schema=SectionState)
    sub.add_node("data_needs", node_section_data_needs)
    sub.add_node("parallel_search", node_parallel_search)
    sub.add_node("merge_data", node_merge_section_data)
    sub.add_edge(START, "data_needs")
    sub.add_edge("data_needs", "parallel_search")
    sub.add_edge("parallel_search", "merge_data")
    sub.add_edge("merge_data", END)
    logger.debug("Section subgraph compiled")
    return sub.compile()


section_subgraph_compiled = create_section_subgraph()
