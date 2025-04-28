#process_section.py
# =============================================================================

import os
import re
import asyncio
import logging
from typing import List, Union, Tuple

from langgraph.graph import StateGraph
from services.deep_research.state import (
    ReportState,
    SectionState,
    SectionContent,
    SearchResult,
    KBCitation,
    WebCitation,
    ExcelCitation
)
from services.deep_research.llm import gpt_4
from langchain_core.messages import SystemMessage, HumanMessage
from services.utils.excel_utils import extract_excel_index
from services.utils.websearch_utils import tavily_search
from services.utils.kb_search import query_kb, get_presigned_url_from_source_uri

# Configure logger
logger = logging.getLogger(__name__)

# Constants
KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID", "my-knowledge-base")
MODEL_ARN = os.getenv("MODEL_ARN", "arn:aws:bedrock:my-model")

# Token trimming
try:
    import tiktoken
    enum_encoding = tiktoken.encoding_for_model("gpt-4o-mini")
except ImportError:
    enum_encoding = None

MAX_TOKENS = 40000

def trim_to_tokens(text: str, max_tokens: int = MAX_TOKENS) -> str:
    if not enum_encoding:
        return text[:8000]
    tokens = enum_encoding.encode(text)
    if len(tokens) <= max_tokens:
        return text
    return enum_encoding.decode(tokens[:max_tokens])


async def node_process_section(state: ReportState) -> ReportState:
    logger.debug("Processing section index: %d", state.current_section_idx)

    # Get current section
    current_state = state.outline[state.current_section_idx]

    # Initialize per-section state
    section_state = SectionState(
        title=current_state.title,
        web_research=state.web_research,
        excel_search=state.config.excel_search,
        kb_search=state.file_search,
        report_type=state.report_type,
        description=current_state.description,
        report_state=state
    )

    from services.deep_research.section_graph import section_subgraph_compiled

    # Process section subgraph
    processed = await section_subgraph_compiled.ainvoke(section_state)
    if isinstance(processed, dict):
        processed_state = convert_to_section_state(state, processed)
    else:
        processed_state = processed

    # Generate content and capture updated state
    processed_state = await generate_section_content(state, processed_state)

    # Retry logic
    for attempt in range(1, state.config.section_iterations + 1):
        success, feedback = evaluate_section(processed_state)
        if success:
            break
        logger.debug("Retry %d for section: %s", attempt, processed_state.title)
        # Re-run subgraph on updated state
        processed = await section_subgraph_compiled.ainvoke(processed_state)
        if isinstance(processed, dict):
            processed_state = convert_to_section_state(state, processed)
        processed_state = await generate_section_content(state, processed_state)

    # Commit content back to outline and advance
    current_state.content = processed_state.content
    state.current_section_idx += 1
    return state


def convert_to_section_state(base_state: ReportState, data: dict) -> SectionState:
    return SectionState(
        title=data.get('title', base_state.outline[base_state.current_section_idx].title),
        description=data.get('description', ''),
        report_state=base_state,
        web_research=data.get('web_research', base_state.web_research),
        excel_search=data.get('excel_search', base_state.config.excel_search),
        kb_search=data.get('kb_search', base_state.file_search),
        report_type=data.get('report_type', base_state.report_type),
        web_results=data.get('web_results', []),
        excel_results=data.get('excel_results', []),
        kb_results=data.get('kb_results', []),
        citations=data.get('citations', []),
        context=data.get('context', []),
        content=data.get('content', ''),
        excel_queries=data.get('excel_queries', []),
        web_queries=data.get('web_queries', []),
        kb_queries=data.get('kb_queries', [])
    )


async def generate_section_content(
    state: ReportState,
    section_state: Union[SectionState, dict]
) -> SectionState:
    logger.debug("Entering generate_section_content for section idx %d", state.current_section_idx)

    # Normalize input
    if isinstance(section_state, dict):
        section_state = convert_to_section_state(state, section_state)

    section_state.attempts += 1
    title = state.outline[state.current_section_idx].title
    logger.debug("Generating content for section: %s (attempt %d)", title, section_state.attempts)

    # Build context
    raw_context = section_state.context or []
    if isinstance(raw_context, list):
        context_text = "\n\n---\n\n".join(str(item) for item in raw_context)
    else:
        context_text = str(raw_context)

    try:
        context_llm = trim_to_tokens(context_text)
    except Exception as e:
        logger.error("Token trimming failed: %s", e)
        context_llm = context_text[:8000]

    structured_llm = gpt_4.with_structured_output(SectionContent, method="function_calling")

    # Invoke LLM
    try:
        section_content = await structured_llm.ainvoke([
            SystemMessage(content=f"You are a senior financial analyst. Report Topic: {state.topic}"),
            HumanMessage(content=(
                f"Title: {title}\n"
                f"Description: {section_state.description}\n"
                f"Context: {context_llm}\n"
                "Requirements: 1) 300-500 words narrative..."
            ))
        ])
        logger.debug("LLM generated content for section: %s", title)

        # Append content
        section_state.content += getattr(section_content, 'content', '')
    except Exception as e:
        logger.error("LLM call failed for section %s: %s", title, e)
        section_state.content = f"Content generation failed: {e}"

    return section_state


def evaluate_section(section_state: SectionState) -> Tuple[bool, str]:
    logger.debug("Evaluating section: %s", section_state.title)
    txt = section_state.content or ""
    words = txt.split()
    fails = []

    if len(words) < 120:
        fails.append(f"Too short ({len(words)} words)")
    if any(ph in txt for ph in ["TBD", "???", "placeholder"]):
        fails.append("Contains placeholder text")
    if any(k in section_state.title.lower() for k in ["financial", "analysis"]):
        if not re.search(r"\d", txt):
            fails.append("No numeric data found")

    if fails:
        return False, "; ".join(fails)
    return True, ""


async def node_section_excel_search(state: SectionState) -> dict:
    logger.debug("Entering node_section_excel_search for section: %s", state.title)
    if state.excel_queries:
        results = await parallel_excel_search(state.report_state, state.excel_queries)
        state.excel_results.append(results)
        state.citations.extend(results.citations)
        state.context.append(results.context_text)
        return {
            "excel_results": [results],
            "citations": results.citations,
            "context": [results.context_text]
        }
    logger.debug("No Excel queries for section: %s", state.title)
    return {}

async def node_section_web_search(state: SectionState) -> dict:
    logger.debug("Entering node_section_web_search for section: %s", state.title)
    if state.web_queries:
        results = await parallel_web_search(state.report_state, state.web_queries)
        state.web_results.append(results)
        state.citations.extend(results.citations)
        state.context.append(results.context_text)
        return {
            "web_results": [results],
            "citations": results.citations,
            "context": [results.context_text]
        }
    logger.debug("No Web queries for section: %s", state.title)
    return {}

async def node_section_kb_search(state: SectionState) -> dict:
    logger.debug("Entering node_section_kb_search for section: %s", state.title)
    if state.kb_queries:
        results = await parallel_kb_query(state.report_state, state.kb_queries)
        state.kb_results.append(results)
        state.citations.extend(results.citations)
        state.context.append(results.context_text)
        return {
            "kb_results": [results],
            "citations": results.citations,
            "context": [results.context_text]
        }
    logger.debug("No KB queries for section: %s", state.title)
    return {}

async def parallel_excel_search(report_state: ReportState, queries: List[str]) -> SearchResult:
    logger.debug("parallel_excel_search with %d queries", len(queries))
    if not report_state.config.excel_search:
        return SearchResult(citations=[], context_text="", original_queries=queries)

    index = extract_excel_index(report_state.user_id, report_state.project_id)
    if not index:
        return SearchResult(citations=[], context_text="", original_queries=queries)

    citations = []
    context_parts = []

    def _search(q: str):
        eng = index.as_query_engine()
        return q, eng.query(q)

    results = await asyncio.gather(
        *[asyncio.to_thread(_search, q) for q in queries],
        return_exceptions=True
    )

    for r in results:
        if isinstance(r, Exception):
            logger.error("Excel search error: %s", r)
            continue
        q, resp = r
        for node in getattr(resp, 'source_nodes', []):
            meta = node.metadata
            citations.append(
                ExcelCitation(
                    file_name=meta.get('file_name',''),
                    sheet=meta.get('sheet',''),
                    row=meta.get('row',0),
                    col=meta.get('col',''),
                    value=node.text
                )
            )
        context_parts.append(f"Excel Q '{q}': {resp}")

    return SearchResult(
        citations=citations,
        context_text="\n\n".join(context_parts),
        original_queries=queries
    )

async def parallel_web_search(report_state: ReportState, queries: List[str]) -> SearchResult:
    logger.debug("parallel_web_search with %d queries", len(queries))
    if not report_state.config.web_research:
        return SearchResult(citations=[], context_text="", original_queries=queries)

    citations: List[WebCitation] = []
    context_parts: List[str] = []

    results = await asyncio.gather(
        *[asyncio.to_thread(tavily_search, q, True, 3) for q in queries],
        return_exceptions=True
    )


    for q, res in zip(queries, results):
        if isinstance(res, Exception):
            logger.error("Web search error for '%s': %s", q, res)
            continue
        hits = res.get("results", [])
        for item in hits:
            # build your citation
            cit = WebCitation(
                title=item.get("title", ""),
                url=item.get("url", ""),
                snippet=item.get("content", "")   # still keep snippet
            )
            citations.append(cit)

            # now use the _full_ raw_content for context
            raw = item.get("raw_content") or item.get("content", "")
            context_parts.append(f"Web Q '{q}':\n{raw}")

    return SearchResult(
        citations=citations,
        context_text="\n\n---\n\n".join(context_parts),
        original_queries=queries
    )

async def parallel_kb_query(report_state: ReportState, queries: List[str]) -> SearchResult:
    logger.debug("parallel_kb_query with %d queries", len(queries))
    citations = []
    context_parts = []

    def _kb(q: str):
        return q, query_kb(q, KNOWLEDGE_BASE_ID, report_state.user_id, report_state.project_id, MODEL_ARN)

    results = await asyncio.gather(
        *[asyncio.to_thread(_kb, q) for q in queries],
        return_exceptions=True
    )

    for r in results:
        if isinstance(r, Exception):
            logger.error("KB search error: %s", r)
            continue
        q, resp = r
        text = resp.get('output', {}).get('text', '')
        context_parts.append(f"KB Q '{q}': {text}")
        for cobj in resp.get('citations', []):
            for ref in cobj.get('retrievedReferences', []):
                metadata = ref.get('metadata', {})
                citations.append(
                    KBCitation(
                        chunk_text=ref.get('content', {}).get('text',''),
                        page=metadata.get('x-amz-bedrock-kb-document-page-number'),
                        file_name=os.path.basename(metadata.get('x-amz-bedrock-kb-source-uri','')), 
                        url=get_presigned_url_from_source_uri(metadata.get('x-amz-bedrock-kb-source-uri',''))
                    )
                )

    return SearchResult(
        citations=citations,
        context_text="\n\n".join(context_parts),
        original_queries=queries
    )
