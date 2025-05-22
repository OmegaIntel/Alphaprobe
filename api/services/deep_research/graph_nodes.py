import os
import re
import asyncio
import logging
from typing import Union, Tuple

from services.deep_research.classes import (
    ReportState,
    SectionState,
    SectionContent,
    SectionChooser,
    UpdateQueries,
    UpdateParagraph,
)
from services.deep_research.llm import gpt_4, trim_to_tokens
from langchain_core.messages import SystemMessage, HumanMessage

from services.deep_research.graph_section import node_merge_section_data, parallel_excel_search, parallel_web_search, parallel_kb_query, section_subgraph_compiled

# Configure logger
logger = logging.getLogger(__name__)

# Constants
KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID", "my-knowledge-base")
MODEL_ARN = os.getenv("MODEL_ARN", "arn:aws:bedrock:my-model")

# ======================================================================= #
# -------------------------- Graph Nodes Func. -------------------------- #
# ======================================================================= #
def node_check_report_exists(state: ReportState) -> ReportState:
    """First node: set state.exists to True if we already have an outline."""
    state.exists = len(state.outline) > 0
    return state

async def node_generate_outline(state: ReportState) -> ReportState:
    """
    Generate a fixed outline for the report based on the topic.
    """
    logger.debug("Using fixed report outline for topic: %s", state.topic)

    # Define your fixed outline here as (title, description) pairs
    fixed_outline = [
        ("Executive Summary", "Concise overview of key findings and recommendations."),
        (
            "Market Overview",
            "Definition, scope, value chain, and high-level industry dynamics.",
        ),
        (
            "Market Size & Growth",
            "Historical, current, and projected market size and growth rates.",
        ),
        (
            "Segmentation Analysis",
            "Breakdown of the market by major segments with their sizes.",
        ),
        ("Competitive Landscape", "Key competitors, market share, and positioning."),
        (
            "Customer Insights",
            "Profiles, needs, and buying behavior of major customer segments.",
        ),
        ("Financial Performance", "Summary of recent financial metrics and trends."),
        (
            "Valuation & Forecast",
            "Valuation approaches, multiples, and forward projections.",
        ),
        ("Risks & Mitigants", "Principal risks and strategies to manage them."),
        ("Conclusions & Next Steps", "Key takeaways and recommended actions."),
    ]

    # Clear any existing outline
    state.outline.clear()

    # Build and append SectionState objects
    for title, description in fixed_outline:
        section = SectionState(
            title=title,
            description=description,
            content="",  # Will be populated later
            report_state=state,
            web_research=state.web_research,
            excel_search=state.config.excel_search,
            kb_search=state.config.file_search,
            report_type=state.report_type,
        )
        state.outline.append(section)
        logger.debug("Added fixed section: %s", title)

    logger.debug("Finished fixed outline with %d sections.", len(state.outline))
    return state

async def recognize_section_to_update(state: ReportState) -> ReportState:
    """
    Pick which existing section (by index) is most relevant to state.update_query.
    """
    # build prompt listing titles & descriptions
    lines = []
    for idx, sec in enumerate(state.outline):
        lines.append(f"{idx}: Title = “{sec.title}”\n   Desc  = {sec.description!r}")
    sections_list = "\n\n".join(lines)

    prompt = f"""
    I have the following report sections (index: title + description):

    {sections_list}

    Now I have an update query:
    “{state.update_query}”

    Please return the single integer field `chosen_index` corresponding to the section
    that best matches this update. If none are relevant, return null.
    """

    logger.debug("Recognizing section to update: %s", prompt)

    chooser = gpt_4.with_structured_output(SectionChooser, method="function_calling")
    resp = await chooser.ainvoke([
        SystemMessage(content="You are a precise section classifier."),
        HumanMessage(content=prompt)
    ])

    logger.debug("Section chooser response: %s", resp)
    state.update_section_index = resp.chosen_index
    return state

async def node_generate_update_queries(state: ReportState) -> ReportState:
    """
    Generates exactly two follow-up queries to research the update,
    using the section’s title & description for context.
    """
    idx = state.update_section_index
    # Safely fetch the section
    if idx is None or idx < 0 or idx >= len(state.outline):
        raise ValueError(f"No valid section at index {idx}")

    section = state.outline[idx]
    title = section.title
    desc = section.description or "No description provided"

    prompt = f"""
        I have an update query:
        “{state.update_query}”

        This update applies to **section #{idx}**:
        - **Title:** {title}
        - **Description:** {desc}

        Please generate **exactly two** highly targeted follow-up queries that will 
        help me drill into the precise facts needed to update this section. 
        Return them as a JSON array under the key `queries`.
        """

    caller = gpt_4.with_structured_output(UpdateQueries, method="function_calling")
    resp = await caller.ainvoke([
        SystemMessage(content="You are a precise research-query generator."),
        HumanMessage(content=prompt)
    ])

    state.update_queries = resp.queries
    return state

def init_sections(state: ReportState) -> ReportState:
    """Initialize section index to zero."""
    state.current_section_idx = 0
    return state

async def node_process_section(state: ReportState) -> ReportState:
    idx = state.current_section_idx
    current = state.outline[idx]

    # ─── UPDATE-MODE: two injected queries ────────────────────────────────
    if state.exists:
        idx_uq = state.update_section_index
        current_uq = state.outline[idx_uq]
        logger.debug("Entering UPDATE mode for section #%d: %s", state.update_section_index, current_uq.title)

        queries = state.update_queries
        all_citations = []
        contexts = []

        # 1) Build our list of tasks
        tasks = []
        if state.web_research:
            tasks.append(asyncio.create_task(parallel_web_search(state, queries)))
        if state.file_search:
            tasks.append(asyncio.create_task(parallel_kb_query(state, queries)))
        if state.config.excel_search:
            tasks.append(asyncio.create_task(parallel_excel_search(state, queries)))

        # 2) Run them in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 3) Collect citations & context_text
        for res in results:
            if isinstance(res, Exception):
                logger.error("Update search task failed: %s", res)
                continue
            all_citations.extend(res.citations)
            contexts.append(res.context_text)

        # Merge into a temporary SectionState just for citations/context
        temp = SectionState(
            title=current_uq.title,
            description=current_uq.description,
            web_research=False,  # already done
            kb_search=False,
            excel_search=False,
            report_type=state.report_type,
            report_state=state,
        )
        temp.citations = all_citations
        temp.context = "\n\n---\n\n".join(contexts)
        # Optionally dedupe citations here...
        merged = node_merge_section_data(temp)

        # 4) Ask the LLM for exactly one new paragraph
        prompt = f"""
        You are a subject-matter expert updating one section of a research report.

        Existing content for section **{idx_uq}: {current_uq.title}**:
        \"\"\"{current_uq.content}\"\"\"

        New research findings from the update queries:
        {merged.context}

        Please write **exactly one** cohesive paragraph that incorporates these new insights **without removing or rewriting** the existing content. Return your answer as JSON under the key `paragraph`.
        """
        updater = gpt_4.with_structured_output(UpdateParagraph, method="function_calling")
        resp = await updater.ainvoke([
            SystemMessage(content="Generate a single update paragraph."),
            HumanMessage(content=prompt)
        ])

        new_para = resp.paragraph.strip()

        # 5) Append the paragraph & citations, advance index, clear update mode
        current_uq.content = current_uq.content.rstrip() + "\n\n" + new_para
        current_uq.citations.extend(merged.citations)
        current_uq.context = merged.context

        state.current_section_idx += 1
        state.update_queries = []  # so we only do this once
        return state

    # ─── FULL-BUILD MODE: fall back to your existing subgraph ─────────────
    logger.debug("Entering FULL-BUILD for section #%d: %s", idx, current.title)
    # 1) Run section subgraph (data_needs → parallel_search → merge_data)
    section_state = SectionState(
        title=current.title,
        description=current.description,
        web_research=state.web_research,
        kb_search=state.file_search,
        excel_search=state.config.excel_search,
        report_type=state.report_type,
        report_state=state,
    )

    processed = await section_subgraph_compiled.ainvoke(section_state)
    if isinstance(processed, dict):
        processed_state = convert_to_section_state(state, processed)
    else:
        processed_state = processed

    # 2) Generate content with retries
    processed_state = await generate_section_content(state, processed_state)

    # Retry logic
    for attempt in range(1, state.config.section_iterations + 1):
        ok, fb = evaluate_section(processed_state)
        if ok:
            break
        logger.debug("Retry %d for section '%s': %s", attempt, processed_state.title, fb)
        processed = await section_subgraph_compiled.ainvoke(processed_state)
        if isinstance(processed, dict):
            processed_state = convert_to_section_state(state, processed)
        processed_state = await generate_section_content(state, processed_state)

    # 3) Commit & advance
    current.content = processed_state.content
    current.citations = processed_state.citations
    state.current_section_idx += 1
    return state

def node_compile_final(state: ReportState) -> ReportState:
    """Compile all sections into a single markdown report, or just the updated section in update‐mode."""
    logger.debug("Entering node_compile_final with %d sections", len(state.outline))

    report_lines = []
    for idx, section in enumerate(state.outline, start=1):
        logger.debug("Adding section %d: %s", idx, section.title)
        header = f"## {idx}. {section.title}\n"
        content = (
            section.content.strip() if section.content else "*No content generated.*"
        )
        report_lines.append(f"{header}\n{content}\n")

    state.final_report = "\n".join(report_lines)
    logger.debug(
        "Final report compiled successfully (length: %d chars)", len(state.final_report)
    )
    return state

# ======================================================================= #
# -------------------------- Utility Functions -------------------------- #
# ======================================================================= #
def convert_to_section_state(base_state: ReportState, data: dict) -> SectionState:
    return SectionState(
        title=data.get(
            "title", base_state.outline[base_state.current_section_idx].title
        ),
        description=data.get("description", ""),
        report_state=base_state,
        web_research=data.get("web_research", base_state.web_research),
        excel_search=data.get("excel_search", base_state.config.excel_search),
        kb_search=data.get("kb_search", base_state.file_search),
        report_type=data.get("report_type", base_state.report_type),
        web_results=data.get("web_results", []),
        excel_results=data.get("excel_results", []),
        kb_results=data.get("kb_results", []),
        citations=data.get("citations", []),
        context=data.get("context", []),
        content=data.get("content", ""),
        excel_queries=data.get("excel_queries", []),
        web_queries=data.get("web_queries", []),
        kb_queries=data.get("kb_queries", []),
    )

async def generate_section_content(
    state: ReportState, section_state: Union[SectionState, dict]
) -> SectionState:
    logger.debug(
        "Entering generate_section_content for section idx %d",
        state.current_section_idx,
    )

    # Normalize input
    if isinstance(section_state, dict):
        section_state = convert_to_section_state(state, section_state)

    section_state.attempts += 1
    title = state.outline[state.current_section_idx].title
    logger.debug(
        "Generating content for section: %s (attempt %d)", title, section_state.attempts
    )

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

    structured_llm = gpt_4.with_structured_output(
        SectionContent, method="function_calling"
    )

    # Invoke LLM
    try:
        section_content = await structured_llm.ainvoke(
            [
                SystemMessage(
                    content=f"You are a senior financial analyst. Report Topic: {state.topic}"
                ),
                HumanMessage(
                    content=(
                        f"Title: {title}\n"
                        f"Description: {section_state.description}\n"
                        f"Context: {context_llm}\n"
                        "Requirements: 1) 300-500 words narrative..."
                    )
                ),
            ]
        )
        logger.debug("LLM generated content for section: %s", title)

        # Append content
        section_state.content += getattr(section_content, "content", "")
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
