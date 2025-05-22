import asyncio
import copy
import textwrap
import time
from typing import List, Dict, Any, Optional
from api.utils.kb_search import retrieve_kb_contexts
from api.utils.websearch_utils import call_tavily_api
from api.services.update_flow.schema import ReportState, UpdateFragment, UpdateType, VisualPatch
# llm_wrapper.py
"""
Thin async helper around ChatOpenAI that returns a *parsed* Pydantic object
via OpenAI function-calling / structured-output.
"""

import os
import logging
from typing import List, Type, TypeVar

from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage
from langchain_core.messages import SystemMessage, HumanMessage

T = TypeVar("T")  # bound to a Pydantic model at call-time

# ------------------------------------------------------------------ #
# 0.  initialise a single ChatOpenAI instance for the whole project
# ------------------------------------------------------------------ #
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY environment variable not set")

logger = logging.getLogger(__name__)
logger.debug("Initialising ChatOpenAI with model gpt-4o-mini")

# helper.py (top level)
GPT4_STRUCTURED = ChatOpenAI(          # for function-calling / tools
    model="gpt-4o-mini",
    temperature=0.0,
    api_key=OPENAI_API_KEY,
    model_kwargs={"parallel_tool_calls": False},
)

GPT4_PLAIN = ChatOpenAI(               # no extra kwargs → plain chat
    model="gpt-4o-mini",
    temperature=0.0,
    api_key=OPENAI_API_KEY,
)

MAX_EVIDENCE_TOKENS = 50000
MAX_WEB_SNIPS = 3
MAX_KB_CHUNKS = 5
KB_ID      = os.getenv("KB_ID")
MODEL_ARN  = os.getenv("MODEL_ARN")
RETRY_DELAY = 0.4  # seconds
# ------------------------------------------------------------------ #
# ─────────────────────────────────────────────────────────────────── #
# ---- tiny helper: LLM section-rewrite ----------------------------- #
async def _rewrite(content: str, directive: str) -> str:
    sys = SystemMessage(content="Rewrite the text per user directive ONLY. Do not reduce the size of the text to a very small size.")
    user = HumanMessage(content=f"Text:\n'''\n{content}\n'''\n\nDIRECTIVE:\n{directive}")
    return (await llm_chat([sys, user], str)).strip()

# 1.  async helper -------------------------------------------------- #
async def llm_chat(messages: List[BaseMessage], schema: Type[T]) -> T:
    # plain text branch
    if schema is str:
        resp = await GPT4_PLAIN.ainvoke(messages)
        return resp.content                       # type: ignore[return-value]

    # structured-output branch
    model = GPT4_STRUCTURED.with_structured_output(
        schema, method="function_calling"
    )
    return await model.ainvoke(messages)

def _collect_evidence(topic: str, file_search: bool, web_search: bool, user_id: str, project_id: str) -> List[str]:
    """
    Returns a flat list of short text snippets for LLM context.
    """
    pieces: List[str] = []

    # Bedrock KB
    if file_search and KB_ID and MODEL_ARN:
        kb_chunks = retrieve_kb_contexts(
            query=topic,
            kb_id=KB_ID,
            user_id=user_id,
            project_id=project_id,
            model_arn=MODEL_ARN,
            top_k=MAX_KB_CHUNKS,
        )
        pieces.extend(kb_chunks[:MAX_KB_CHUNKS])

    # Tavily Web
    if web_search:
        web_hits = call_tavily_api(topic)[:MAX_WEB_SNIPS]
        for hit in web_hits:
            snippet = hit.get("snippet") or hit.get("content", "")
            pieces.append(f"{hit.get('title','')}. {snippet}".strip())

    return pieces

def _compress_evidence(pieces: List[str]) -> str:
    """
    Quick heuristic truncation: keep adding snippets until ~MAX_EVIDENCE_TOKENS.
    """
    combined, token_est = [], 0
    for p in pieces:
        tok_est = len(p.split())  # ≈ 1 token per word is OK for heuristic
        if token_est + tok_est > MAX_EVIDENCE_TOKENS:
            break
        combined.append(p)
        token_est += tok_est
    return "\n\n".join(combined)

# ------------------------------------------------------------------ #
async def run_research(topics: List[str], file_search: bool, web_search: bool, user_id: str, project_id: str) -> Dict[str, str]:
    """
    Parameters
    ----------
    topics : List[str]

    Returns
    -------
    Dict[str, str]
        {topic: synthesized_paragraphs}
    """
    results: Dict[str, str] = {}

    sys_msg = SystemMessage(content=textwrap.dedent("""\
        You are a precise research assistant.
        Based ONLY on the evidence provided, write 1–2 coherent paragraphs
        that (a) directly answer the research topic, (b) keep quantitative
        details, and (c) require no extra commentary. Do NOT cite sources;
        just weave the facts naturally. Length limit ≈ 250 words.
    """))

    for topic in topics:
        evidence_snips = _collect_evidence(topic, file_search, web_search, user_id, project_id)
        if not evidence_snips:
            logger.warning("[run_research] No evidence for topic '%s'", topic)
            results[topic] = ""
            continue

        ctx = _compress_evidence(evidence_snips)
        user_msg = HumanMessage(content=f"Topic: {topic}\n\nEVIDENCE:\n{ctx}")

        # call GPT-4o-mini and expect plain text
        enrichment_text: str = (await llm_chat([sys_msg, user_msg], str)).strip()
        results[topic] = enrichment_text
        logger.debug("[run_research] topic='%s' ⇒ %d chars", topic, len(enrichment_text))

        # polite delay for free tiers
        await asyncio.sleep(RETRY_DELAY)

    return results

def _needs_visual_refresh(frag: UpdateFragment) -> bool:
    return frag.update_type in {
        UpdateType.VISUAL_TYPE_CHANGE,
        UpdateType.VISUAL_DATA_CORRECTION,
    }

# ---------------------------------------------------------------------- #
def _patch_single_visual(visual: dict, directive: str) -> dict:
    """
    Calls GPT to return a patched spec+caption (dict unchanged on failure).
    """
    sys = SystemMessage(content=textwrap.dedent(f"""\
        You are a data-viz assistant.
        The JSON/Markdown `spec` below renders a visual in our UI.
        Apply ONLY the user's directive—do not invent new data.
        Return a JSON object with exactly:
          spec    – full replacement spec
          caption – updated caption text
    """))

    user = HumanMessage(content=textwrap.dedent(f"""\
        Current visual spec (do NOT modify outside your output field):

        ```\n{visual['spec']}\n```

        Visual type: {visual.get('type','unknown')}
        Current caption: {visual.get('caption','')}

        USER DIRECTIVE:
        {directive}
    """))

    try:
        patch: VisualPatch = llm_chat([sys, user], VisualPatch)
        new_viz           = copy.deepcopy(visual)
        new_viz["spec"]   = patch.spec.strip()
        new_viz["caption"]= patch.caption.strip()
        return new_viz
    except Exception as e:
        logger.warning("Visual patch failed (%s); leaving original", e)
        return visual

# ---------------------------------------------------------------------- #
def render_visuals(report: ReportState, fragments: List[UpdateFragment]):
    """
    Walk every UpdateFragment that calls for a visual change and
    overwrite `report.visuals[...]` in-place.  All other visuals untouched.
    """
    if not fragments:
        return

    # Map id→visual for quick lookup
    vis_lookup = {v["id"]: v for v in report.visuals.values()}

    for frag in fragments:
        if not _needs_visual_refresh(frag):
            continue
        for vid in (frag.target_visuals or []):
            if vid not in vis_lookup:
                logger.debug("Visual id '%s' not found; skipping", vid)
                continue
            directive = frag.note or "Update the visual as requested."
            vis_lookup[vid] = _patch_single_visual(vis_lookup[vid], directive)

    # Write back to report.visuals
    report.visuals.update({v["id"]: v for v in vis_lookup.values()})
