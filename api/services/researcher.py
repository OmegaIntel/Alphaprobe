import asyncio
import os
import nest_asyncio
import json
from typing import List, TypedDict, Any, Optional, Tuple
from pydantic import BaseModel, Field
from dataclasses import dataclass, fields
import re

import tiktoken
from common_logging import logerror

from utils.kb_search import query_kb
from utils.websearch_utils import call_tavily_api
from utils.pdf_parser import extract_pdf_from_s3, parse_pdf_structure

from fastapi import HTTPException

from langchain_core.runnables import RunnableConfig

# ------------------------------------------------------------------------
# LlamaIndex for loading/creating a vector index and querying
# ------------------------------------------------------------------------
from llama_index.llms.openai import OpenAI
from llama_index.core import Settings

# ------------------------------------------------------------------------
# langgraph-based StateGraph
# ------------------------------------------------------------------------
from langgraph.graph import START, END, StateGraph

nest_asyncio.apply()

BUCKET_NAME = os.getenv("BUCKET_NAME", "deep-research-docs")
KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID")
DATA_SOURCE_ID = os.getenv("DATA_SOURCE_ID")
MODEL_ARN = os.getenv("MODEL_ARN")
ENC = tiktoken.encoding_for_model("gpt-4o-mini")
MAX_TOKENS = 4000
# ------------------------ Configuration ------------------------
@dataclass(kw_only=True)
class Configuration:
    """The configurable fields for the chatbot."""
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

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def setup_models():
    print("[DEBUG] Entering setup_models")
    """Initialize LLM and embedding models for the workflow."""
    Settings.llm = OpenAI(
        model="gpt-4o-mini",  # Change to your actual model if needed
        temperature=0.1,
        openai_api_key=OPENAI_API_KEY
    )
    print("[DEBUG] LLM model set up with model: gpt-4o-mini")
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

class ReportState(TypedDict):
    topic: str
    user_id: str
    project_id: str
    headings: List[str]
    index: str
    outline: str
    questions: List[str]
    answers: List[Tuple[str, str]]
    previous_questions: List[Tuple[str, str]]
    report: str
    web_search: bool
    file_search: bool

class InstructionRequest(BaseModel):
    query: str
    report_type: int
    file_search:bool
    web_search:bool
    project_id: str

# ------------------------------------------------------------------------
# HELPER FUNCTIONS
# ------------------------------------------------------------------------
def trim_to_tokens(text: str, max_tokens: int = MAX_TOKENS) -> str:
    tokens = ENC.encode(text)
    if len(tokens) <= max_tokens:
        return text
    # Keep the first N tokens and decode back
    return ENC.decode(tokens[:max_tokens])

def parse_llm_questions(questions_raw: str) -> List[str]:
    """Parse LLM-generated questions that might be in JSON, code blocks, or plain text."""
    # Normalize whitespace first
    questions_raw = questions_raw.strip()
    
    # Try to detect and remove markdown/code fences
    if questions_raw.startswith("```") and questions_raw.endswith("```"):
        questions_raw = re.sub(r"^```(?:json)?\s*", "", questions_raw, flags=re.IGNORECASE)
        questions_raw = re.sub(r"\s*```$", "", questions_raw)
    
    # Attempt JSON parsing first
    try:
        questions = json.loads(questions_raw)
        if isinstance(questions, list):
            # Validate each item is a string
            return [str(q).strip() for q in questions if str(q).strip()]
        elif isinstance(questions, dict):
            # Handle case where LLM returns {"questions": [...]}
            if "questions" in questions and isinstance(questions["questions"], list):
                return [str(q).strip() for q in questions["questions"] if str(q).strip()]
    except json.JSONDecodeError:
        pass  # Not JSON, try other formats
    
    # Fallback to line-based parsing
    questions = []
    for line in questions_raw.split("\n"):
        line = line.strip()
        # Skip empty lines and list markers (e.g., "1. ", "- ")
        if not line or re.match(r'^[\d\-]+\.[\s]*', line):
            continue
        # Remove any remaining list markers or quotes
        line = re.sub(r'^[\"\'\-\*]\s*|\s*[\"\'\-\*]$', '', line)
        if line:
            questions.append(line)
    
    return questions

def preprocess_tavily_results(web_results):
    """Extract most relevant snippets from Tavily results"""
    processed = []
    for result in web_results:
        processed.append(
            f"Source: {result.get('title', 'Unknown')}\n"
            f"URL: {result.get('url', '')}\n"
            f"Content: {result.get('content', result.get('snippet', ''))[:500]}\n"
        )
    return "\n---\n".join(processed)

def validate_report(report: str, answers: list) -> bool:
    """Check if report properly incorporates answers"""
    required_coverage = sum(1 for q,a in answers if "MISSING" not in a and "PARTIAL" not in a)
    actual_coverage = sum(1 for q,a in answers if a.lower() in report.lower())
    return actual_coverage >= required_coverage * 0.7  # At least 70% coverage
# ------------------------------------------------------------------------
# GRAPH NODES
# ------------------------------------------------------------------------
async def formulate_plan(state: ReportState, config: RunnableConfig):
    print("[DEBUG] Entering formulate_plan with state:", state)
    
    # 1. Extract PDF from S3 (similar to node_generate_outline)
    pdf_text = await extract_pdf_from_s3(state["user_id"], state["project_id"])
    print(f"[DEBUG] PDF text length: {len(pdf_text) if pdf_text else 0}")
    
    pdf_sections = []
    if pdf_text:
        pdf_sections = parse_pdf_structure(pdf_text)
        print(f"[DEBUG] Parsed {len(pdf_sections)} PDF sections")
    else:
        default = await extract_pdf_from_s3("default", "outline")
        if default:
            pdf_sections = parse_pdf_structure(default)
            print(f"[DEBUG] Parsed {len(pdf_sections)} default PDF sections")

    # ---------------------------------------
    # CASE 1: PDF sections exist - use them directly
    # ---------------------------------------
    if pdf_sections:
        print("[DEBUG] Using PDF sections directly for outline")
        outline_sections = []
        for sec in pdf_sections:
            title = sec.get("title", "Untitled Section")
            content = sec.get("content", "")
            outline_sections.append(f"## {title}\n\n{content}")
        
        outline_text = "\n\n".join(outline_sections)
        print(f"[DEBUG] Generated outline from PDF with {len(outline_sections)} sections")
        return {"outline": outline_text}

    # ---------------------------------------
    # CASE 2: No PDF - generate outline via LLM
    # ---------------------------------------
    print("[DEBUG] No PDF sections found, generating outline via LLM")
    query_context = state["topic"]
    headings = state["headings"]
    headings_text = "\n".join([f"{i+1}. {h}" for i, h in enumerate(headings)]) if headings else "No specific headings provided."

    outline_prompt = f"""You are an expert financial and industry analyst. Based on the topic and headings, produce a structured outline for a report.

Required Headings (MUST INCLUDE VERBATIM):
{headings_text}

Additional Context:
Topic: {query_context}

Generate an outline that:
1. Preserves all required headings exactly as provided
2. Adds complementary sections for a comprehensive analysis
3. Follows logical flow from overview to detailed analysis to conclusions

Output format:
- Use markdown formatting with ## for main sections and ### for subsections
- Include brief descriptions under each section heading
- Create at most 10 main sections
"""

    print("\n[formulate_plan] Outline Prompt:\n", outline_prompt)
    response = await Settings.llm.acomplete(outline_prompt)
    outline_text = response.text if hasattr(response, "text") else str(response)

    print("\n[formulate_plan] Outline Generated:\n", outline_text)
    print("[DEBUG] Exiting formulate_plan with outline.")
    return {"outline": outline_text}

async def formulate_questions(state: ReportState, config: RunnableConfig) -> None:
    print("[DEBUG] Entering formulate_questions with state:", state)
    outline = state["outline"]

    question_prompt = f"""You are an expert financial and industry analyst. Generate precise research questions to populate the following report outline.

Report Outline:
{outline}

Generate questions that:
1. Extract specific data points needed for each section
2. Cover both quantitative and qualitative aspects
3. Address competitive landscape and market positioning
4. Explore financial performance and key ratios (if applicable)
5. Investigate emerging trends and growth opportunities

Question Requirements:
- Each question should target a specific data need
- Include questions that would require different data sources (documents, web, Excel)
- Prioritize questions that will yield actionable insights
- Ensure coverage of all key aspects in the outline

Output Format:
- Return exactly 10 questions as a JSON array
- Order questions logically following the outline structure
- Each question should be self-contained and specific

Example:
[
    "What is the current market size in USD and growth rate for the last 5 years?",
    "Who are the top 3 competitors and what are their market shares?",
    "What are the key regulatory factors impacting this market?"
]

Generate your questions:"""
    
    print("\n[formulate_questions] Questions Prompt:\n", question_prompt)
    response = await Settings.llm.acomplete(trim_to_tokens(question_prompt))
    questions_raw = response.text if hasattr(response, "text") else str(response)

    try:
        questions = parse_llm_questions(questions_raw)
    except Exception as e:
        logerror(f"Error parsing questions: {e}")
        questions = []  # Or some default fallback
    
    print(f"\n[formulate_questions] Parsed {len(questions)} questions:\n", questions)
    print("[DEBUG] Exiting formulate_questions with questions.")
    return {"questions": questions}

async def answer_questions(state: ReportState, config: RunnableConfig):
    print("[answer_questions] Entering answer_questions function")
    
    # Show initial state details (only keys that are safe to log)
    print(f"[answer_questions] State keys: {list(state.keys())}")
    
    questions = state["questions"]
    user_id = state["user_id"]
    project_id = state["project_id"]
    file_search = state["file_search"]
    web_search = state["web_search"]

    print(f"[answer_questions] 1. Questions {questions}\n[answer_questions] 2. User_id {user_id}\n[answer_questions] 3. Project_id {project_id}\n[answer_questions] 4. File_search {file_search}\n[answer_questions] 5. Web_search {web_search}")
    answers = []
    
    print(f"[answer_questions] Number of questions to process: {len(questions)}")
    
    for idx, question in enumerate(questions, start=1):
        print(f"[answer_questions] Processing question {idx}: {question.strip()}")
        question = question.strip()
        file_context = ""
        web_context = ""
    
        # File search using query_kb if enabled
        if file_search:
            print(f"[answer_questions] File search enabled for question: {question}")
            try:
                kb_response = query_kb(
                    question, 
                    KNOWLEDGE_BASE_ID, 
                    user_id, 
                    project_id, 
                    MODEL_ARN
                )
                print(f"[answer_questions] KB response received for question: {question}")
                if kb_response and "output" in kb_response:
                    file_context = kb_response["output"].get("text", "")
                    print(f"[answer_questions] Extracted file_context of length: {len(file_context)}")
                else:
                    print(f"[answer_questions] KB response did not contain 'output' key for question: {question}")
            except Exception as e:
                print(f"[ERROR] KB query failed for question: {question} with error: {str(e)}")
                file_context = "Error retrieving document context"
    
        # Web search using Tavily if enabled
        if web_search:
            print(f"[answer_questions] Web search enabled for question: {question}")
            try:
                # Run the synchronous API call in a thread
                web_results = await asyncio.to_thread(call_tavily_api, question)
                if web_results:
                    web_context = preprocess_tavily_results(web_results)
                else:
                    combined_context += "No web results found"
                print(f"[answer_questions] Compiled web_context length: {len(web_context)}")
            except Exception as e:
                print(f"[ERROR] Web search failed for question: {question} with error: {str(e)}")
                web_context = "Error retrieving web context"
    
        combined_context = (file_context + "\n\n" + web_context).strip()
        print(f"[answer_questions] Combined context length: {len(combined_context)} for question: {question}")
        if not combined_context:
            combined_context = "No relevant context found"
            print(f"[answer_questions] No context found for question: {question}")
    
        prompt = f"""Extract relevant information to answer: {question}
        
CONTEXT:
{combined_context}

INSTRUCTIONS:
1. Provide the most accurate answer possible from the context
2. Include specific numbers, names, dates when available
3. Cite sources using [Source: title/url]
4. If unsure, provide partial information marked with "PARTIAL:"

ANSWER FORMAT:
<answer content>
[Source: <most relevant source>]"""
        
        response = await Settings.llm.acomplete(trim_to_tokens(prompt))
        answer = response.text.strip()
        
        # Fallback if answer is too short
        if len(answer) < 20 and web_context:
            answer = f"PARTIAL: Relevant context found but exact answer unclear\n{web_context[:500]}"
            
        answers.append((question, answer))
    
    print("[answer_questions] Exiting answer_questions function")
    return {"answers": answers}

async def write_report(state: ReportState, config: RunnableConfig):
    print("[DEBUG] Entering write_report with state:", state)
    """
    Gather all answers, wait a short time for all question events to complete,
    then build a final report with the LLM.
    """
    answers = state["answers"]
    questions = state["questions"]

    print(f"[write_report] Found {len(answers)} answers. Expected {len(questions)} originally.")

    if not answers:
        print("[write_report] No answers found, returning None.")
        return None

    # Log each answer for debugging
    for idx, (question, answer) in enumerate(answers, start=1):
        print(f"[write_report] Answer {idx}:\n Q: '{question}'\n A: '{answer}'\n")

    # Merge with previously answered (if any)
    previous_questions = state.get("previous_questions", [])
    previous_questions.extend(answers)
    outline = state["outline"]

    # --- NEW: Updated Final Prompt ---
    final_prompt = f"""Transform these research findings into a professional market report:

REPORT OUTLINE:
{outline}

RESEARCH FINDINGS:
{previous_questions}

INSTRUCTIONS:
1. Create a flowing narrative using the Q&A data
2. Keep all numerical data and sources intact
3. Use markdown formatting with:
   - ## for main sections
   - ### for subsections
   - Bullet points for lists
   - Tables for comparative data
4. Highlight data gaps with "[NEEDS MORE RESEARCH]"
5. For missing information, write: "[DATA NOT FOUND]"
6. Maintain formal business tone throughout

OUTPUT REQUIREMENTS:
- Minimum 800 words
- All figures and statistics must come from the research findings
- Include a 'Data Limitations' section at the end"""
    
    for idx, (question, answer) in enumerate(answers, start=1):
        final_prompt += f"\nQ{idx}: {question}\nA{idx}: {answer}\n"

    print("\n[write_report] Final Summarize Prompt:\n", final_prompt)
    response = await Settings.llm.acomplete(trim_to_tokens(final_prompt))
    report_text = response.text if hasattr(response, "text") else str(response)
    if not validate_report(report_text, state["answers"]):
        print("[WARNING] Generated report has low answer coverage")
    print("\n[write_report] Final Report (preview):\n", report_text[:300], "...")
    print("[DEBUG] Exiting write_report with report generated.")
    return {"report": report_text, "previous_questions": previous_questions}

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

# ------------------------------------------------------------------------
# CALLING FUNCTION AND HELPERS
# ------------------------------------------------------------------------
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

async def generate_structured_report(instruction: str, report_type: int, file_search:bool, web_search:bool, project_id: str, user_id: str):
    print("[DEBUG] Entering generate_structured_report with query:", instruction, "user_id:", user_id, "project_id:", project_id)
    try:
        setup_models()
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
                "sections": []
            }
    except Exception as e:
        print(f"[generate_report] Error encountered: {str(e)}")
        logerror(f"Error in generate_report: {e}")
        print("[DEBUG] Exiting generate_report endpoint with error.")
        raise HTTPException(status_code=500, detail=str(e))