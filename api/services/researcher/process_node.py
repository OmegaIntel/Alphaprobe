import asyncio
import os
import nest_asyncio
import json
from typing import List, Any
import re
from researcher.stats import (
    ReportState,
    Citation,
    KBCitation,
    WebCitation,
)
from utils.kb_search import get_presigned_url_from_source_uri, query_kb
from utils.websearch_utils import call_tavily_api
from utils.pdf_parser import extract_pdf_from_s3, parse_pdf_structure
from langchain_core.runnables import RunnableConfig
from utils.bedrock_llm import ClaudeWrapper, DeepSeekWrapper, trim_fenced, unwrap_boxed
from api.services.researcher.prompts import OUTLINE_PROMPT
from dotenv import load_dotenv, find_dotenv

env_path = find_dotenv()  # walks up until it finds .env
loaded = load_dotenv(env_path)

nest_asyncio.apply()


KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID")
MODEL_ARN = os.getenv("MODEL_ARN")



print("[DEBUG] Initializing deepseek with model deepseek.r1-v1:0")
deepseek = DeepSeekWrapper(temperature=0.0)
haiku = ClaudeWrapper(temperature=0.0)

# global collector
CITATIONS: List[Citation] = []


# ------------------------------------------------------------------------
# GRAPH NODES
# ------------------------------------------------------------------------
async def formulate_plan(state: ReportState, config: RunnableConfig):
    print("[DEBUG] Entering formulate_plan with state:", state)

    # 1. User-specific PDF extraction
    pdf_text = await extract_pdf_from_s3(state["user_id"], state["project_id"])
    print(f"[DEBUG] PDF text length (user): {len(pdf_text) if pdf_text else 0}")
    pdf_sections = parse_pdf_structure(pdf_text) if pdf_text else []

    # 2. Default outline PDF extraction if no user PDF sections
    if not pdf_sections:
        default_text = await extract_pdf_from_s3("default", "outline")
        print(
            f"[DEBUG] PDF text length (default): {len(default_text) if default_text else 0}"
        )
        pdf_sections = parse_pdf_structure(default_text) if default_text else []

    # CASE: PDF sections exist (from user or default)
    if pdf_sections:
        print(
            f"[DEBUG] PDF sections found: {len(pdf_sections)}. Using them for outline."
        )
        outline_lines = [
            f"{idx+1}. {sec.get('title', 'Untitled Section')}"
            for idx, sec in enumerate(pdf_sections)
        ]
        outline_text = "\n".join(outline_lines)
        return {"outline": outline_text}

    # 3. No PDF sections – fallback to LLM-based outline generation
    print("[DEBUG] No PDF sections found. Generating outline via LLM.")
    query_context = state.get("topic", "")
    headings = state.get("headings", [])
    headings_text = (
        "\n".join([f"{i+1}. {h}" for i, h in enumerate(headings)])
        if headings
        else "No specific headings provided."
    )

    messages = [
        {"role": "system", "content": "You are an expert market research analyst."},
        {"role": "user", "content": f"{OUTLINE_PROMPT}"},
    ]

    try:
        outline_text = await deepseek.ainvoke(messages)
        return {"outline": outline_text}
    except Exception as e:
        print(f"[ERROR] Outline generation failed: {e}")
        return {"outline": "Failed to generate outline"}


async def formulate_questions(state: ReportState, config: RunnableConfig):
    """Generate ~5 focused questions for **each numbered section** in the outline.
    Stores:
      • `questions` – flat list used downstream
      • `questions_by_section` – for debugging / future use
    """
    outline = state["outline"].strip()
    if not outline:
        return {"questions": [], "questions_by_section": []}

    blocks = re.split(r"(?m)^\s*(?=\d+\.\s+)", outline)
    blocks = [b.strip() for b in blocks if b.strip()]

    all_qs: list[str] = []
    by_section: list[dict[str, Any]] = []

    async def _ask_llm(prompt_msgs):
        for attempt in range(6):
            try:
                return await haiku.ainvoke(prompt_msgs)
            except RuntimeError as e:
                if "ThrottlingException" not in str(e):
                    raise
                await asyncio.sleep(2**attempt)
        raise RuntimeError("deepseek throttling persisted after retries.")

    for block in blocks:
        lines = block.splitlines()
        header = lines[0].strip()
        rest_lines = lines[1:]
        sub_outline = "\n".join(rest_lines).strip()

        # now build a prompt that includes only the sub‑outline
        prompt = (
            f"You’re a senior market‑research analyst.\n"
            f"Report Topic: {state['topic']}\n\n"
            f"Section Title: {header}\n"
            f"Sub‑points to cover:\n{sub_outline}\n\n"
            "Draft exactly five concise, open‑ended questions that begin with “What” or “How”, and include the report topic's essence"
            "and that will elicit the specific facts, metrics, or insights needed to fully flesh out each sub‑point above. "
            "Return only a JSON array of strings."
        )

        msgs = [
            {"role": "system", "content": "You are a market‑research expert."},
            {"role": "user", "content": prompt},
        ]
        raw = await _ask_llm(msgs)
        cleaned = trim_fenced(unwrap_boxed(raw))
        cleaned = re.sub(r"^```(?:json)?\n|\n```$", "", cleaned)
        try:
            qs = json.loads(cleaned)
            if not isinstance(qs, list):
                raise ValueError
        except Exception:
            qs = []
            for line in cleaned.splitlines():
                text = line.strip()  # remove leading/trailing whitespace
                text = text.lstrip("•")  # remove bullet if it’s at the start
                text = text.strip('"')  # remove surrounding quotes
                if text:
                    qs.append(text)
                if len(qs) == 5:
                    break

        all_qs.extend(qs)
        by_section.append({"section": header, "questions": qs})

    return {"questions": all_qs, "questions_by_section": by_section}


async def answer_questions(state: ReportState, config: RunnableConfig):
    """Collect context snippets and structured citations for each question."""
    questions: list[str] = state.get("questions", [])

    answers: list[tuple[str, str]] = []
    citations: list[dict[str, Any]] = []

    async def _gather_ctx(q: str):
        # Kick off KB and web searches concurrently
        kb_task = (
            asyncio.to_thread(
                query_kb,
                q,
                KNOWLEDGE_BASE_ID,
                state["user_id"],
                state["project_id"],
                MODEL_ARN,
            )
            if state.get("file_search")
            else asyncio.sleep(0, result={})
        )
        web_task = (
            asyncio.to_thread(call_tavily_api, q)
            if state.get("web_search")
            else asyncio.sleep(0, result=[])
        )
        kb_resp, web_resp = await asyncio.gather(kb_task, web_task)

        # Extract plain text answer
        file_ctx = (
            kb_resp.get("output", {}).get("text", "")
            if isinstance(kb_resp, dict)
            else ""
        )
        hits = web_resp or []
        answer_text = "\n\n".join(
            [file_ctx]
            + [
                f"{h.get('title','')}\n{h.get('answer') or h.get('snippet','')}"
                for h in hits
            ]
        ).strip()

        # Build structured citations
        local_cits: list[Citation] = []
        # KB citations
        if isinstance(kb_resp, dict):
            for ref in kb_resp.get("retrievedReferences", []):
                cit = KBCitation(
                    chunk_text=ref.get("content", {}).get("text", ""),
                    page=ref.get("metadata", {}).get(
                        "x-amz-bedrock-kb-document-page-number"
                    ),
                    file_name=os.path.basename(
                        ref.get("metadata", {}).get("x-amz-bedrock-kb-source-uri", "")
                    ),
                    url=get_presigned_url_from_source_uri(
                        ref.get("metadata", {}).get("x-amz-bedrock-kb-source-uri", "")
                    ),
                )
                local_cits.append(cit)
        # Web citations
        for h in hits:
            cit = WebCitation(
                title=h.get("title", ""),
                url=h.get("url", ""),
                snippet=h.get("answer") or h.get("snippet", ""),
            )
            local_cits.append(cit)

        return q, answer_text, local_cits

    # Gather results for all questions
    gathered = await asyncio.gather(
        *[asyncio.create_task(_gather_ctx(q)) for q in questions]
    )

    # Serialize answers and citations
    for q, ans, local_cits in gathered:
        answers.append((q, ans))
        for c in local_cits:
            if isinstance(c, KBCitation):
                CITATIONS.append(
                    {
                        "type": "kb",
                        "chunk_text": c.chunk_text,
                        "page": c.page,
                        "file_name": c.file_name,
                        "url": c.url,
                    }
                )
            else:
                CITATIONS.append(
                    {
                        "type": "web",
                        "title": c.title,
                        "url": c.url,
                        "snippet": c.snippet,
                    }
                )

    return {"answers": answers, "citations": citations}


async def write_report(state: ReportState, config: RunnableConfig):
    """Compose the final report section‑by‑section, inserting citations list."""
    answers = state.get("answers", [])
    citations = state.get("citations", [])
    if not answers:
        return {
            "report": "*No answers were available to generate a report.*",
            "citations": [],
        }
    outline = state.get("outline", "")
    section_blocks = [
        b.strip() for b in re.split(r"(?m)^\s*(?=\d+\.\s+)", outline) if b.strip()
    ]

    citation_map = {c["question"]: c["links"] for c in citations}
    report_parts = []

    async def _ask_llm_retry(msgs):
        for attempt in range(6):
            try:
                return await haiku.ainvoke(msgs)
            except RuntimeError as e:
                if "ThrottlingException" not in str(e):
                    raise
                await asyncio.sleep(2**attempt)
        raise RuntimeError("deepseek throttling persisted after retries.")

    for block in section_blocks:
        title, *rest = block.splitlines()
        subs = [r.strip("-• ") for r in rest if r.strip()]
        sub_set = [title] + subs
        relevant_qas = [
            (q, a, citation_map.get(q, []))
            for q, a in answers
            if any(s.lower() in q.lower() for s in sub_set)
        ]
        qa_text = "\n".join(f"**{q}**:\n{a}" for q, a, _ in relevant_qas)
        prompt = (
            f"Please draft only the final Markdown content for section **{title}** as follows:\n\n"
            f"## {title}\n\n"
            "Use `##` for the section title and `###` for each sub-point. "
            "Include each sub-point only when evidence exists; omit any without data. if the section must include data that u don't have, hallucinate or research on your own little but don't send X in place of data"
            "Render numeric data as Markdown tables when appropriate; otherwise write concise paragraphs. "
            "Do not output any reasoning steps, internal thoughts, or process details—only the completed section. "
            "Ensure the section is fully generated and not cut off.\n\n"
            "### Sub‑points\n" + "\n".join(f"- {s}" for s in subs) + "\n\n"
            "Return the content in pure Markdown."
        )

        msgs = [
            {
                "role": "system",
                "content": (
                    "You are a professional report writer. "
                    "When drafting a Markdown section, do not include any internal thoughts, reasoning steps, or planning—only return the completed section."
                    "You are a seasoned market‑research analyst."
                    "You are an expert in financial due diligence and market analysis."
                ),
            },
            {"role": "user", "content": prompt},
        ]
        raw = await _ask_llm_retry(msgs)
        section_txt = trim_fenced(unwrap_boxed(raw)).strip()
        report_parts.append(f"{section_txt}")

    full_report = "\n\n".join(report_parts)
    return {"report": full_report, "citations": citations}

