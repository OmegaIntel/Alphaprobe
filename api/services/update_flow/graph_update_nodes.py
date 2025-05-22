import re
from typing import Any, Dict, List

import logging
from api.services.deep_research.deep_research import outline_dicts_to_section_states
from api.services.update_flow.schema import OutputStyle, SectionState, UpdateGraphState, UpdateRequest, UpdateType
from api.services.update_flow.helper import llm_chat, run_research, render_visuals, _rewrite

from langchain_core.messages import SystemMessage, HumanMessage
logger = logging.getLogger(__name__)

# ─────────────────── node 1: parse_updates ─────────────────────────
async def node_parse_updates(state: UpdateGraphState) -> UpdateGraphState:
    logger.debug("Parsing update state: %s", state)
    sys_prompt = (
        "You are an expert update parser.  "
        "Convert the user’s free-text update request into a JSON payload matching the UpdateRequest schema.  "
        "Use the outline indices when the user refers to section numbers.  "
        "Rules for fragments:\n"
        "  • If the user asks to add or enrich section content (e.g. “add more detail on X” or “expand the analysis”), set update_type=DATA_ENRICHMENT, target_sections to the referenced section(s), need_research=true, and populate research_topics with the topics/queries to fetch.\n"
        "  • If they explicitly request a **table** or a **list** or anything like that, also set note=\"table\"|\"list\"... etc so downstream can build it.\n"
        "  • If the user requests formatting or tone changes tied to new research (e.g. “format the new content as bullets”), treat it as affecting only those research-related sections (target_sections set, need_research=true).\n"
        "  • If the user issues a general formatting change (e.g. “use dashes instead of bullets”, “make all headings uppercase”), set update_type=GENERAL_FORMATTING or BULLET_STYLE_CHANGE as appropriate, leave target_sections null (apply to all), and need_research=false.\n"
        "  • For visual changes (e.g. “update chart 2 to show percentages”), set update_type=VISUAL_TYPE_CHANGE or VISUAL_DATA_CORRECTION, target_visuals to the referenced visual IDs, and need_research=false unless new data is requested.\n"
        "  • Handle section reordering, adding, removing, merging, numeric updates, factual fixes, and tone changes by choosing the correct update_type and target_sections.\n"
        "Always return JSON ONLY with a top-level “fragments” list of UpdateFragment objects."
        "You are an expert update parser."
        "Convert the user’s free-text instructions into JSON that matches the UpdateRequest schema."
        """For each fragment decide **output_style**:
        • If the user says “provide a table …”, “tabulate …”, or “list year-by-year figures …” → MARKDOWN_TABLE
        • If the user asks for “bullet points”, “key take-aways”, “make it concise bullets” → BULLETS
        • If the user asks for a chart/graph/visual → CHART
        • Otherwise PARAGRAPH.

        Return JSON only.
        Examples
        USER: “Add bullet-point take-aways to section 2”
        → output_style = "BULLETS"

        USER: “Give me a table of last 5-year revenues for the competitors”
        → output_style = \"MARKDOWN_TABLE\""""
    )
    
    logger.debug("Parsing section title: %s", state.report.outline[0].title)
    # Map outline index → section dict for quick look-up
    outline_titles = [f"{i}: {sec.title}" for i, sec in enumerate(state.report.outline)]\
    
    messages = [
        {"role": "system", "content": sys_prompt},
        {"role": "user",
         "content": f"Outline: {outline_titles}\n\nUser: {state.query}"}
    ]

    update_req: UpdateRequest = await llm_chat(messages, UpdateRequest)  # ← await
    state.update_req = update_req

    # Aggregate research topics
    topics = [
        topic
        for frag in update_req.fragments
        if frag.need_research and frag.research_topics
        for topic in frag.research_topics
    ]
    state.research_queries = topics
    state.need_research = bool(topics)
    return state

# ─────────────────── node 2: plan_updates ─────────────────────────
def node_plan_updates(state: UpdateGraphState) -> UpdateGraphState:
    """
    Decide coarse flags (already set in parse), but you might add others here,
    e.g., `need_visual_refresh`, `needs_outline_regen`, etc.
    """
    state.need_visual_refresh = any(
        f.update_type in {
            UpdateType.VISUAL_TYPE_CHANGE,
            UpdateType.VISUAL_DATA_CORRECTION
        } for f in state.update_req.fragments
    )
    return state

# ─────────────────── node 3: fetch_sources ────────────────────────
async def node_fetch_sources(state: UpdateGraphState) -> UpdateGraphState:
    """
    If we need research, actually await the async helper and store its result.
    """
    if not state.need_research:
        return state

    # run_research is async, so we must await it
    state.new_data = await run_research(
        state.research_queries,
        state.report.file_search,
        state.report.web_research,
        state.report.user_id,
        state.report.project_id,
    )
    return state

# ─────────────────── node 4: apply_fragments ──────────────────────
async def node_apply_fragments(state: UpdateGraphState) -> UpdateGraphState:
    rpt  = state.report

    # Map outline index → section dict for quick look-ups
    sections: List[SectionState] = rpt.outline

    for frag in state.update_req.fragments:

        # 1️⃣  SECTION ORDER ------------------------------------------------
        if frag.update_type == UpdateType.SECTION_ORDERING and frag.target_sections:
            a, b = frag.target_sections[:2]
            rpt.outline[a], rpt.outline[b] = rpt.outline[b], rpt.outline[a]

        # 2️⃣  DATA ENRICHMENT --------------------------------------------
        elif frag.update_type == UpdateType.DATA_ENRICHMENT and state.new_data:
            idxs = frag.target_sections or []
            # merge evidence from *all* requested topics
            evidence = "\n\n".join(state.new_data[t] for t in frag.research_topics)

            if frag.output_style == OutputStyle.MARKDOWN_TABLE:
                prompt = (
                    "Using ONLY the evidence below, produce a Markdown table. "
                    "Rows = the past 5 years (newest first). "
                    "Columns = each competitor mentioned. "
                    "Include a header row.  NO extra text.\n\nEVIDENCE:\n" + evidence
                )
            elif frag.output_style == OutputStyle.BULLETS:
                prompt = (
                    "Rewrite the evidence into 5-8 concise bullet points. "
                    "Keep key numbers.  No paragraph text.\n\nEVIDENCE:\n" + evidence
                )
            else:  # PARAGRAPH (default)
                prompt = (
                    "Summarise the evidence in ~2 coherent paragraphs; weave numbers naturally. "
                    "Do NOT cite sources.\n\nEVIDENCE:\n" + evidence
                )

            rewritten: str = await llm_chat(
                [SystemMessage(content="You are a precise formatter."),
                HumanMessage(content=prompt)],
                str
            )
            for i in idxs:
                rpt.outline[i].content += "\n\n" + rewritten

        # 3️⃣  ADD SECTION -------------------------------------------------
        elif frag.update_type == UpdateType.ADD_SECTION:
            title = frag.note or f"New Section {len(rpt.outline)+1}"
            idx   = len(rpt.outline)
            rpt.outline.append({"title": title})
            sections[idx] = {"content": ""}

        # 4️⃣  REMOVE SECTION ---------------------------------------------
        elif frag.update_type == UpdateType.REMOVE_SECTION and frag.target_sections:
            for i in sorted(frag.target_sections, reverse=True):
                rpt.outline.pop(i)
                sections.pop(i, None)

        # 5️⃣  MERGE SECTIONS ---------------------------------------------
        elif frag.update_type == UpdateType.MERGE_SECTIONS and frag.target_sections:
            primary, *rest = frag.target_sections
            for idx in rest:
                sections[primary]["content"] += "\n\n" + sections[idx]["content"]
                rpt.outline.pop(idx)
                sections.pop(idx, None)

        # 6️⃣  UPDATE NUMERIC VALUES --------------------------------------
        elif frag.update_type == UpdateType.UPDATE_NUMERIC_VALUES and frag.note:
            pattern, replacement = frag.note.split("->", 1) if "->" in frag.note else (None, None)
            for i in frag.target_sections or []:
                if pattern and replacement:
                    sections[i]["content"] = re.sub(pattern.strip(),
                                                    replacement.strip(),
                                                    sections[i]["content"])

        # 7️⃣  FIX FACTUAL ERROR -----------------------------------------
        elif frag.update_type == UpdateType.FIX_FACTUAL_ERROR and frag.note:
            for i in frag.target_sections or []:
                sections[i]["content"] = await _rewrite(sections[i]["content"],
                                                        f"Fix this factual error: {frag.note}")

        # 8️⃣  LANGUAGE / TONE CHANGE ------------------------------------
        elif frag.update_type == UpdateType.LANGUAGE_TONE_CHANGE and frag.note:
            for i in frag.target_sections or list(sections.keys()):
                sections[i]["content"] = await _rewrite(sections[i]["content"],
                                                        f"Change tone: {frag.note}")

        # 9️⃣  GENERAL / BULLET STYLE ------------------------------------
        elif frag.update_type in {
            UpdateType.GENERAL_FORMATTING,
            UpdateType.BULLET_STYLE_CHANGE,
        }:
            for i in frag.target_sections or list(sections.keys()):
                if frag.update_type == UpdateType.BULLET_STYLE_CHANGE:
                    sections[i]["content"] = sections[i]["content"].replace("•", "-")
                # add more formatting tweaks as needed

        # 🔟  VISUAL FLAGS -------------------------------------------------
        elif frag.update_type in {
            UpdateType.VISUAL_TYPE_CHANGE,
            UpdateType.VISUAL_DATA_CORRECTION,
        }:
            # merely set a flag; real work happens in node_update_visuals
            state.need_visual_refresh = True

    # write back (sections is a view on rpt.sections, so already mutated)
    return state

# ─────────────────── node 5: update_visuals ───────────────────────
def node_update_visuals(state: UpdateGraphState) -> UpdateGraphState:
    if getattr(state, "need_visual_refresh", False):
        render_visuals(state.report, state.update_req.fragments)
    return state

# ─────────────────── node 6: compile_final ────────────────────────
def node_compile_final(state: UpdateGraphState) -> UpdateGraphState:
    """
    Do final tidy-ups: deduplicate citations, reindex headings, etc.
    Crucially, **do not** discard existing content—only append/modify.
    """
    # 2️⃣ Rebuild the final_report by enumerating sections
    report_lines = [] 
    for idx, section in enumerate(state.report.outline, start=1):
        logger.debug("Adding section %d: %s", idx, section.title)
        header = f"## {idx}. {section.title}\n"
        content = section.content.strip() if section.content else "*No content generated.*"
        report_lines.append(f"{header}\n{content}\n")

    state.report.final_report = "\n".join(report_lines)
    logger.debug(
        "Final report compiled successfully (length: %d chars)",
        len(state.report.final_report),
    )
    return state
