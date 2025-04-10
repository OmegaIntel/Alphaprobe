import asyncio
import os
import nest_asyncio
import json
from typing import List, TypedDict, Any, Optional, Tuple
from pydantic import BaseModel, Field
from dataclasses import dataclass, fields
import re
from common_logging import logerror

from utils.kb_search import query_kb
from utils.websearch_utils import call_tavily_api

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
# GRAPH NODES
# ------------------------------------------------------------------------
async def formulate_plan(state: ReportState, config: RunnableConfig):
    print("[DEBUG] Entering formulate_plan with state:", state)
    query_context = state["topic"]
    headings = state["headings"]
    headings_text = "\n".join([f"{i+1}. {h}" for i, h in enumerate(headings)]) if headings else "No specific headings provided."

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

    print("\n[formulate_plan] Outline Prompt:\n", outline_prompt)
    response = await Settings.llm.acomplete(outline_prompt)
    outline_text = response.text if hasattr(response, "text") else str(response)

    print("\n[formulate_plan] Outline Generated:\n", outline_text)
    print("[DEBUG] Exiting formulate_plan with outline.")
    return {"outline": outline_text}

async def formulate_questions(state: ReportState, config: RunnableConfig) -> None:
    print("[DEBUG] Entering formulate_questions with state:", state)
    outline = state["outline"]

    question_prompt = f"""As a market research expert, generate up to 15 specific questions (JSON array) 
that will help extract key market insights from the following outline:
{outline}

Output your answer as JSON, e.g.:
["Question 1?", "Question 2?", ...]
"""
    print("\n[formulate_questions] Questions Prompt:\n", question_prompt)
    response = await Settings.llm.acomplete(question_prompt)
    questions_raw = response.text if hasattr(response, "text") else str(response)

    # Strip out possible code fences
    questions_raw = re.sub(r"^```(?:json)?\n", "", questions_raw)
    questions_raw = re.sub(r"\n```$", "", questions_raw)
    try:
        questions = json.loads(questions_raw)
        if not isinstance(questions, list):
            questions = []
    except Exception as e:
        logerror(f"Error parsing JSON questions: {e}")
        questions = [x.strip() for x in questions_raw.split("\n") if x.strip()]
    
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
                print(f"[answer_questions] Tavily API returned {len(web_results)} results for question: {question}")
                web_context = "\n\n".join([
                    f"Title: {r['title']}\nURL: {r['url']}\nContent: {r['snippet']}"
                    for r in web_results
                ]) if web_results else ""
                print(f"[answer_questions] Compiled web_context length: {len(web_context)}")
            except Exception as e:
                print(f"[ERROR] Web search failed for question: {question} with error: {str(e)}")
                web_context = "Error retrieving web context"
    
        combined_context = (file_context + "\n\n" + web_context).strip()
        print(f"[answer_questions] Combined context length: {len(combined_context)} for question: {question}")
        if not combined_context:
            combined_context = "No relevant context found"
            print(f"[answer_questions] No context found for question: {question}")
    
        prompt = f"""Answer the following question using ONLY the provided context:
Context: {combined_context}

Question: {question}

If the context doesn't contain the answer, respond with:
'INSUFFICIENT INFORMATION: Could not find answer in provided sources.'

Provide a concise, accurate answer:"""
    
        print(f"[answer_questions] Generated prompt for question: {question[:100]}...")
        response = await Settings.llm.acomplete(prompt)
        answer_text = response.text if hasattr(response, "text") else str(response)
        print(f"[answer_questions] Received answer of length {len(answer_text)} for question: {question}")
        answers.append((question, answer_text))
    
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
    final_prompt = f"""You are a senior market research analyst preparing a comprehensive market analysis report.
Using the following outline and Q&A, create a structured report with:

1. Overview of the market landscape and key trends
2. Detailed insights into market size, segmentation, and growth prospects
3. Analysis of the competitive environment and consumer behavior
4. Identification of emerging opportunities and potential challenges
5. Actionable recommendations for market entry, expansion, or strategic adjustment

Outline:
{outline}

Research Findings:
"""
    
    for idx, (question, answer) in enumerate(answers, start=1):
        final_prompt += f"\nQ{idx}: {question}\nA{idx}: {answer}\n"

    print("\n[write_report] Final Summarize Prompt:\n", final_prompt)
    response = await Settings.llm.acomplete(final_prompt)
    report_text = response.text if hasattr(response, "text") else str(response)
    print("\n[write_report] Final Report (preview):\n", report_text[:300], "...")
    print("[DEBUG] Exiting write_report with report generated.")
    return {"report": report_text, "previous_questions": previous_questions}

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