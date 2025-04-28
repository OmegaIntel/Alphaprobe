import asyncio
import os
import nest_asyncio
import json
from typing import List, TypedDict, Any, Optional, Tuple
from pydantic import BaseModel
from dataclasses import dataclass, fields
import re
from common_logging import logerror
import tiktoken

from services.utils.kb_search import get_presigned_url_from_source_uri, query_kb
from services.utils.websearch_utils import call_tavily_api, fetch_article
from services.utils.pdf_parser import extract_pdf_from_s3, parse_pdf_structure

from fastapi import HTTPException

from langchain_core.runnables import RunnableConfig

# ------------------------------------------------------------------------
# deepseek & OpenRouter Setup
# ------------------------------------------------------------------------
from openai import OpenAI as ORouterClient
from services.utils.bedrock_llm import ClaudeWrapper, DeepSeekWrapper, trim_fenced, unwrap_boxed

# configure OpenAI SDK to hit OpenRouter
import openai
from llama_index.core import Settings

# ------------------------------------------------------------------------
# langgraph-based StateGraph
# ------------------------------------------------------------------------
from langgraph.graph import START, END, StateGraph
from dotenv import load_dotenv, find_dotenv

env_path = find_dotenv()              # walks up until it finds .env
loaded  = load_dotenv(env_path)

nest_asyncio.apply()
# Load environment variables
# ------------------------ Environment Variables ------------------------
enc = tiktoken.get_encoding("cl100k_base")
MAX_CTX_TOKENS = 30000  # safeguard for deepseek
BUCKET_NAME = os.getenv("BUCKET_NAME", "deep-research-docs")
KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID")
DATA_SOURCE_ID = os.getenv("DATA_SOURCE_ID")
MODEL_ARN = os.getenv("MODEL_ARN")
# ------------------------ Configuration ------------------------
DEFAULT_REPORT_STRUCTURE = """The report structure should focus on providing a comprehensive breakdown of the user-provided topic. Ensure sections are logically structured, with research-driven insights where applicable.

1. **Introduction** (no research needed)
   - Overview of the topic area, including its relevance and importance.
   - Purpose and scope of the report.

2. **Executive Summary** (high-level overview)
   - Brief summary of the key findings.
   - Summary of recommendations.

3. **Main Body Sections** (customizable to the topic):
   3.1 **Financial Performance Analysis** (or core performance analysis)  
       - Historical trends, revenue growth, and profitability.
       - Quality of earnings or performance metrics.
       - Cost structure, margin analysis, and adjustments.
       - Key risks and challenges (e.g., customer concentration risks).

   3.2 **Balance Sheet Review**  
       - Asset quality, valuation, and receivables.
       - Debt and liability structure.
       - Off-balance sheet items.

   3.3 **Cash Flow Analysis**  
       - Operating cash flow health.
       - Capital expenditures and allocation.
       - Working capital and liquidity management.

   3.4 **Projections and Assumptions**  
       - Management forecasts and underlying assumptions.
       - Stress-testing and sensitivity analysis.
       - Comparisons to historical trends.

   3.5 **Key Financial Metrics and KPIs**  
       - Liquidity, profitability, and efficiency metrics.
       - Areas for improvement.

   3.6 **Risk Assessment**  
       - Financial risks (e.g., credit, liquidity, and market risks).
       - Operational and supply chain risks.
       - External risks (e.g., competition and regulatory risks).

4. **Accounting Policies and Practices**  
   - Compliance with accounting standards.
   - Internal controls and financial integrity.
   - Identification of irregularities, if any.

5. **Tax Considerations**  
   - Tax compliance and strategies.
   - Outstanding disputes or liabilities.

6. **Key Findings and Red Flags**  
   - Critical findings from the report.
   - Potential risks and red flags for immediate attention.
   - Implications for future financial health.

7. **Recommendations**  
   - Actionable recommendations based on findings.
   - Cost management and operational efficiency improvements.
   - Cash flow and revenue optimization strategies.

8. **Conclusion**  
   - Recap of the key points.
   - High-level summary of risks, findings, and suggested actions.
   - Include any tables, lists, or visual summaries to enhance clarity.

---
**Note**: This structure is flexible enough to be adapted for topics outside financial due diligence, focusing on organizing key findings, risks, and actionable recommendations in any complex analysis.
"""

@dataclass(kw_only=True)
class Configuration:
    """The configurable fields for the chatbot."""
    report_structure: str = DEFAULT_REPORT_STRUCTURE
    number_of_queries: int = 2
    tavily_topic: str = "general"
    tavily_days: Optional[str] = None

    @classmethod
    def from_runnable_config(
        cls, config: Optional[RunnableConfig] = None
    ) -> "Configuration":
        print("[DEBUG] Entering Configuration.from_runnable_config")
        configurable = (
            config["configurable"] if config and "configurable" in config else {}
        )
        values: dict[str, Any] = {
            f.name: os.environ.get(f.name.upper(), configurable.get(f.name))
            for f in fields(cls)
            if f.init
        }
        result = cls(**{k: v for k, v in values.items() if v})
        print("[DEBUG] Exiting Configuration.from_runnable_config with values:", result)
        return result

# -------------------------------------------------------------------------
# 1) LLM & Embedding Setup
# -------------------------------------------------------------------------
openai.base_url = "https://openrouter.ai/api/v1"
openai.api_key  = os.getenv("OPENROUTER_API_KEY")

# build a client that knows how to talk to OpenRouter
client = ORouterClient()

# Update deepseek initialization - remove the old gpt_4 reference
print("[DEBUG] Initializing deepseek with model deepseek.r1-v1:0")
deepseek = DeepSeekWrapper(temperature=0.0)
haiku = ClaudeWrapper(temperature=0.0)

# ------------------------------------------------------------------------
# SCHEMAS
# ------------------------------------------------------------------------
class ReportStateInput(TypedDict):
    topic: str  # e.g. "Financial due diligence for Company X"
    headings: List[str]
    index: str
    user_id: str
    project_id: str
    file_search: bool
    web_search: bool

class ReportStateOutput(TypedDict):
    report: str
    citations: List[dict[str, Any]]

class ReportState(TypedDict):
    topic: str
    user_id: str
    project_id: str
    headings: List[str]
    index: str
    outline: str
    questions: List[Tuple[str, str]]
    questions_by_section: List[dict[str, Any]]
    citations: List[dict[str, Any]]
    answers: List[Tuple[str, str]]
    previous_questions: List[Tuple[str, str]]
    report: str
    web_search: bool
    file_search: bool

class InstructionRequest(BaseModel):
    query: str
    report_type: int
    file_search: bool
    web_search: bool
    project_id: str

@dataclass
class Citation:
    pass

@dataclass
class KBCitation(Citation):
    chunk_text: str
    page: Optional[int]
    file_name: str
    url: str

@dataclass
class WebCitation(Citation):
    title: str
    url: str
    snippet: str

# global collector
CITATIONS: List[Citation] = []


# ------------------------------------------------------------------------
# GRAPH NODES
# ------------------------------------------------------------------------
async def formulate_plan(state: ReportState, config: RunnableConfig):
    print("[DEBUG] Entering formulate_plan with state:", state)

    # 1. User-specific PDF extraction
    pdf_text = await extract_pdf_from_s3(state['user_id'], state['project_id'])
    print(f"[DEBUG] PDF text length (user): {len(pdf_text) if pdf_text else 0}")
    pdf_sections = parse_pdf_structure(pdf_text) if pdf_text else []

    # 2. Default outline PDF extraction if no user PDF sections
    if not pdf_sections:
        default_text = await extract_pdf_from_s3("default", "outline")
        print(f"[DEBUG] PDF text length (default): {len(default_text) if default_text else 0}")
        pdf_sections = parse_pdf_structure(default_text) if default_text else []

    # CASE: PDF sections exist (from user or default)
    if pdf_sections:
        print(f"[DEBUG] PDF sections found: {len(pdf_sections)}. Using them for outline.")
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
        if headings else "No specific headings provided."
    )

    outline_prompt = f"""You are an expert market research analyst.
Create a detailed outline for a comprehensive market analysis report.
The outline should cover:
- Market size and growth trends
- Consumer behavior and segmentation
- Competitive landscape and positioning
- Regulatory environment and economic influences
- Emerging trends and growth opportunities

Provided Headings:
{headings_text}

Query Context: {query_context}

Produce a structured, actionable outline for a complete market analysis.
"""

    messages = [
        {"role": "system", "content": "You are an expert market research analyst."},
        {"role": "user",   "content": outline_prompt}
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
                await asyncio.sleep(2 ** attempt)
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
                text = line.strip()              # remove leading/trailing whitespace
                text = text.lstrip('•')          # remove bullet if it’s at the start
                text = text.strip('"')           # remove surrounding quotes
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
            asyncio.to_thread(query_kb, q, KNOWLEDGE_BASE_ID, state["user_id"], state["project_id"], MODEL_ARN)
            if state.get("file_search") else asyncio.sleep(0, result={})
        )
        web_task = (
            asyncio.to_thread(call_tavily_api, q)
            if state.get("web_search") else asyncio.sleep(0, result=[])
        )
        kb_resp, web_resp = await asyncio.gather(kb_task, web_task)

        # Extract plain text answer
        file_ctx = kb_resp.get("output", {}).get("text", "") if isinstance(kb_resp, dict) else ""
        hits = web_resp or []
        answer_text = "\n\n".join([file_ctx] + [f"{h.get('title','')}\n{h.get('answer') or h.get('snippet','')}" for h in hits]).strip()

        # Build structured citations
        local_cits: list[Citation] = []
        # KB citations
        if isinstance(kb_resp, dict):
            for ref in kb_resp.get("retrievedReferences", []):
                cit = KBCitation(
                    chunk_text=ref.get("content", {}).get("text", ""),
                    page=ref.get("metadata", {}).get("x-amz-bedrock-kb-document-page-number"),
                    file_name=os.path.basename(ref.get("metadata", {}).get("x-amz-bedrock-kb-source-uri", "")),
                    url=get_presigned_url_from_source_uri(ref.get("metadata", {}).get("x-amz-bedrock-kb-source-uri", ""))
                )
                local_cits.append(cit)
        # Web citations
        for h in hits:
            cit = WebCitation(
                title=h.get("title", ""),
                url=h.get("url", ""),
                snippet=h.get("answer") or h.get("snippet", "")
            )
            local_cits.append(cit)

        return q, answer_text, local_cits

    # Gather results for all questions
    gathered = await asyncio.gather(*[asyncio.create_task(_gather_ctx(q)) for q in questions])

    # Serialize answers and citations
    for q, ans, local_cits in gathered:
        answers.append((q, ans))
        for c in local_cits:
            if isinstance(c, KBCitation):
                CITATIONS.append({
                    "type": "kb",
                    "chunk_text": c.chunk_text,
                    "page": c.page,
                    "file_name": c.file_name,
                    "url": c.url,
                })
            else:
                CITATIONS.append({
                    "type": "web",
                    "title": c.title,
                    "url": c.url,
                    "snippet": c.snippet,
                })

    return {"answers": answers, "citations": citations}

async def write_report(state: ReportState, config: RunnableConfig):
    """Compose the final report section‑by‑section, inserting citations list."""
    answers = state.get("answers", [])
    citations = state.get("citations", [])
    if not answers:
        return {"report": "*No answers were available to generate a report.*", "citations": []}
    outline = state.get("outline", "")
    section_blocks = [b.strip() for b in re.split(r"(?m)^\s*(?=\d+\.\s+)", outline) if b.strip()]

    citation_map = {c["question"]: c["links"] for c in citations}
    report_parts = []

    async def _ask_llm_retry(msgs):
        for attempt in range(6):
            try:
                return await haiku.ainvoke(msgs)
            except RuntimeError as e:
                if "ThrottlingException" not in str(e):
                    raise
                await asyncio.sleep(2 ** attempt)
        raise RuntimeError("deepseek throttling persisted after retries.")

    for block in section_blocks:
        title, *rest = block.splitlines()
        subs = [r.strip("-• ") for r in rest if r.strip()]
        sub_set = [title] + subs
        relevant_qas = [(q, a, citation_map.get(q, [])) for q, a in answers if any(s.lower() in q.lower() for s in sub_set)]
        qa_text = "\n".join(f"**{q}**:\n{a}" for q, a, _ in relevant_qas)
        prompt = (
            f"Please draft only the final Markdown content for section **{title}** as follows:\n\n"
            f"## {title}\n\n"
            "Use `##` for the section title and `###` for each sub-point. "
            "Include each sub-point only when evidence exists; omit any without data. if the section must include data that u don't have, hallucinate or research on your own little but don't send X in place of data"
            "Render numeric data as Markdown tables when appropriate; otherwise write concise paragraphs. "
            "Do not output any reasoning steps, internal thoughts, or process details—only the completed section. "
            "Ensure the section is fully generated and not cut off.\n\n"
            "### Sub‑points\n"
            + "\n".join(f"- {s}" for s in subs)
            + "\n\n"
            "Return the content in pure Markdown."
        )

        msgs = [
            {"role": "system", "content": ("You are a professional report writer. "
                                        "When drafting a Markdown section, do not include any internal thoughts, reasoning steps, or planning—only return the completed section."
                                        "You are a seasoned market‑research analyst."
                                        "You are an expert in financial due diligence and market analysis.")},
            {"role": "user", "content": prompt},
        ]
        raw = await _ask_llm_retry(msgs)
        section_txt = trim_fenced(unwrap_boxed(raw)).strip()
        report_parts.append(f"{section_txt}")

    full_report = "\n\n".join(report_parts)
    return {"report": full_report, "citations": citations}

async def review_report(state: ReportState, config: RunnableConfig):
    print("[DEBUG] Entering review_report with state:", state)
    """
    For testing, we forcibly approve the final report to produce a StopEvent.
    """
    report = state["report"]
    print("\n[review_report] Forcing approval for testing.\n")
    print("[DEBUG] Exiting review_report with report approved.")
    return {"report": report}

# ------------------------------------------------------------------------
# BUILD THE MAIN GRAPH
# ------------------------------------------------------------------------
def build_document_graph():
    print("[DEBUG] Entering build_document_graph")
    builder = StateGraph(
        state_schema=ReportState,
        input=ReportStateInput,
        output=ReportStateOutput,
        config_schema=Configuration
    )

    # Add nodes with their associated functions
    builder.add_node("formulate_plan", formulate_plan)
    builder.add_node("formulate_questions", formulate_questions)
    builder.add_node("answer_questions", answer_questions)
    builder.add_node("write_report", write_report)

    # Define the edges between nodes
    builder.add_edge(START, "formulate_plan")
    builder.add_edge("formulate_plan", "formulate_questions")
    builder.add_edge("formulate_questions", "answer_questions")
    builder.add_edge("answer_questions", "write_report")
    builder.add_edge("write_report", END)

    document_graph = builder.compile()
    print("[DEBUG] Exiting build_document_graph")
    return document_graph

def validate_input_state(input_state: dict) -> ReportStateInput:
    required_keys = {"topic", "headings", "index"}
    if not required_keys.issubset(input_state.keys()):
        raise ValueError(f"Input state must contain the following keys: {required_keys}")
    
    if not isinstance(input_state["topic"], str):
        raise TypeError("'topic' must be a string")
    
    if not isinstance(input_state["headings"], list) or not all(isinstance(h, str) for h in input_state["headings"]):
        raise TypeError("'headings' must be a list of strings")
    
    if not isinstance(input_state["index"], str):
        raise TypeError("'index' must be a string")
    
    return input_state  # Now it's guaranteed to match ReportStateInput

template_heading = [
    {
        "heading": [
            "Company Overview",
            "Business Model & Operations",
            "Industry Position & Competitive Landscape",
            "Financial Performance",
            "Corporate Actions & Strategic Initiatives",
            "Corporate Actions & Strategic Initiatives",
            " Investment & Risk Analysis",
            "ESG (Environmental, Social, Governance) Factors"
        ],
        "templateId": "company-profile"
    },
    {
        "heading": [
            "Company Overview & Financial Context",
            "Financial Statements Breakdown",
            "Ratio & Trend Analysis",
            "Comparative & Benchmarking Analysis",
            "Financial Health & Risk Assessment",
            "Valuation & Investment Potential"
        ],
        "templateId": "financial-statement-analysis"
    },
    {
        "heading": [
            "Market Overview",
            "Market Segmentation & Trends",
            "Competitive Landscape & Key Players",
            "Customer Insights & Buying Behavior",
            "Market Opportunities & Challenges",
            "Business & Marketing Strategy Implications",
            "Regional & Global Market Analysis"
        ],
        "templateId": "market-size"
    },
]

async def generate_structured_report(instruction: str, report_type: int, file_search:bool, web_search:bool, project_id: str, user_id: str):
    print("[DEBUG] Entering generate_structured_report with query:", instruction, "user_id:", user_id, "project_id:", project_id)
    try:
        index_name = f"d{project_id}".lower()
        print(f"[generate_structured_report] Using index name: {index_name}")

        document_graph = build_document_graph()
        print("[generate_structured_report] Document graph built successfully.")

        headings = template_heading[report_type]["heading"]

        input_state = {
            "topic": instruction,
            "headings": headings,
            "index": index_name,
            "user_id": user_id,
            "project_id": project_id,
            "file_search": file_search,
            "web_search": web_search
        }

        # Validate the input state (optional)
        # validated_input_state = validate_input_state(input_state)
        print("[generate_structured_report] Input state for document graph:", input_state)

        # Run the graph
        final_state = await document_graph.ainvoke(input_state)
        if final_state is None:
            print("[ERROR] The state graph returned None. Check the graph flow and node return values.")

        print("[DEBUG] Final state received from document graph:", final_state)
        
        # Access the final report directly from the merged state
        report = final_state.get("report")
        if not report:
            raise ValueError("Report not found in final state.")
        return {"report": report}
    except Exception as e:
        logerror(f"Error generating report: {str(e)}")
        print("[DEBUG] Exception in generate_structured_report:", e)
        return None
# -------------------------------------------------------------------------
# 3) FastAPI Router with Endpoints
# -------------------------------------------------------------------------

async def generate_report(instruction: str, report_type: int, file_search:bool, web_search:bool, project_id: str, user_id: str):
    print("[DEBUG] Entering generate_report endpoint")
    

    try:
        # print(f"[generate_report] Step 1: Received query: {query}")
        # print(f"[generate_report] Step 2: Received project_id: {query.project_id}")
        # print("[generate_report] Step 3: Validating deal ID and user...")
        
        print("[generate_report] Step 4: Deal validation successful.")
        print("[generate_report] Step 5: Generating structured report...")

        report_content = await generate_structured_report(instruction, report_type, file_search, web_search, project_id, user_id)
        if not report_content:
            print("[generate_report] Step 5.1: Report generation failed.")
            raise HTTPException(status_code=404, detail="Failed to generate report.")
        
        print("[generate_report] Step 6: Report generated successfully.")
        print("[generate_report] Step 7: Saving report to database...")
        
        print("[DEBUG] Exiting generate_report endpoint with success.")
        return {
                "message": "Report generated and saved successfully",
                "report": report_content.get("report", ""),
                "sections": CITATIONS,
            }
    except Exception as e:
        print(f"[generate_report] Error encountered: {str(e)}")
        logerror(f"Error in generate_report: {e}")
        print("[DEBUG] Exiting generate_report endpoint with error.")
        raise HTTPException(status_code=500, detail=str(e))
