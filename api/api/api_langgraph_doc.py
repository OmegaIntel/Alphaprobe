import os
import uuid
import asyncio
import nest_asyncio
import json
from typing import List, TypedDict, Any, Optional, Tuple, Dict
from pydantic import BaseModel, Field
from dataclasses import dataclass, fields
import pandas as pd
import re
from common_logging import loginfo, logerror

from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from api.api_user import get_current_user, User as UserModelSerializer
from db_models.deals import Deal, DealStatus
from db_models.rag_session import RagSession
from db_models.report import Report
from db_models.session import get_db

from langchain_core.runnables import RunnableConfig
from langchain_core.messages import SystemMessage, HumanMessage

# ------------------------------------------------------------------------
# LlamaIndex for loading/creating a vector index and querying
# ------------------------------------------------------------------------
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.core import Settings

# ------------------------------------------------------------------------
# langgraph-based StateGraph
# ------------------------------------------------------------------------
from langgraph.constants import Send
from langgraph.graph import START, END, StateGraph

from db_models.opensearch_llamaindex import (
    create_collection,
    update_collection,
    delete_index,
    query_index
)

nest_asyncio.apply()

# ------------------------------------------------------------------------
# Knowledge-base implementation
# ------------------------------------------------------------------------
import boto3

s3_client = boto3.client(
    "s3",
    aws_access_key_id="AKIA5FTZD4AADPXMJD7C",
    aws_secret_access_key="k1OveeJ7XKxO1PExUSTk/NulLMWkFjYwlXGrmQR/",
    region_name="us-east-1"  # Change to your AWS region
)

bedrock_client = boto3.client('bedrock-agent',
    aws_access_key_id="AKIA5FTZD4AADPXMJD7C",
    aws_secret_access_key="k1OveeJ7XKxO1PExUSTk/NulLMWkFjYwlXGrmQR/",
    region_name="us-east-1"
)  # for control-plane ops like ingestion

bedrock_runtime = boto3.client('bedrock-agent-runtime',
    aws_access_key_id="AKIA5FTZD4AADPXMJD7C",
    aws_secret_access_key="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",
    region_name="us-east-1"
)

BUCKET_NAME = os.getenv("BUCKET_NAME", "deep-research-docs")
KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID")
DATA_SOURCE_ID = os.getenv("DATA_SOURCE_ID")
MODEL_ARN = os.getenv("MODEL_ARN")

generationPrompt="""
You are an intelligent assistant tasked with organizing and prioritizing search results for a user query. 
Analyze the following search results and rank them based on relevance to the user's question. 
If any results are irrelevant or redundant, exclude them.

User Query: $query$

Search Results:
$search_results$

Instructions:
1. Rank the search results by relevance to the user's query.
2. Remove any duplicate or irrelevant results.
3. Summarize the key points from the top results.

current time $current_time$

Output the organized and prioritized results in a structured format."""

orchestrationPrompt="""
You are a knowledgeable assistant with access to a comprehensive knowledge base. 
Use the following organized search results to answer the user's question. 
If the search results do not contain enough information, say "I don't know."

User Query: $query$

Instructions:
1. Provide a clear and concise answer to the user's question.
2. Use only the information from the search results.
3. If the search results are insufficient, say "I don't know."
4. Format the response in a professional and easy-to-read manner.

Underlying instructions for formatting the response generation and citations. $output_format_instructions$

Here is the conversation history $conversation_history$

current time - $current_time$

Answer:"""

def query_kb(input, kbId, user_id, project_id, modelId=None): 
    vector_search_config = {'numberOfResults': 5}
    filters = []

    if user_id:
        filters.append({
            "equals": {
                "key": "user_id",
                "value": str(user_id)
            }
        })

    # Only add a project_id filter if it's not "none"
    if project_id and project_id != "none":
        filters.append({
            "equals": {
                "key": "project_id",
                "value": project_id
            }
        })

    # Combine filters if necessary using "andAll"
    if filters:
        if len(filters) == 1:
            vector_search_config['filter'] = filters[0]
        else:
            vector_search_config['filter'] = {"andAll": filters}

    response = bedrock_runtime.retrieve_and_generate(
        input={
            'text': input
        },
        retrieveAndGenerateConfiguration={
            'knowledgeBaseConfiguration': {
                'generationConfiguration': {
                    'promptTemplate': {
                        'textPromptTemplate': generationPrompt
                    }
                },
                'orchestrationConfiguration': {
                    'queryTransformationConfiguration': {
                        'type': 'QUERY_DECOMPOSITION'  # Allowed enum value.
                    }
                },
                'knowledgeBaseId': kbId,
                'modelArn': modelId,
                'retrievalConfiguration': {
                    'vectorSearchConfiguration': vector_search_config
                }
            },
            'type': 'KNOWLEDGE_BASE'
        }
    )

    return response

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
    # If using text-embedding-ada-002 (1536D), do NOT specify 'dimensions='
    # Let the library detect dimension automatically.
    Settings.embed_model = OpenAIEmbedding(
        model="text-embedding-ada-002",
        openai_api_key=OPENAI_API_KEY
    )
    print("[DEBUG] Embedding model set up with model: text-embedding-ada-002")
    print("[DEBUG] Exiting setup_models")

# ------------------------------------------------------------------------
# Web Search Function (using Tavily API and SerpAPI as an example)
# ------------------------------------------------------------------------
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")

async def tavily_search(query: str) -> Any:
    """
    Perform a web search using the Tavily API.
    Returns a list of results.
    """
    import requests, time  # local import for async context
    print(f"[DEBUG] Starting Tavily search for query: {query}")
    api_url = "https://api.tavily.com/search"
    headers = {"Authorization": f"Bearer {TAVILY_API_KEY}", "Content-Type": "application/json"}
    payload = {"query": query, "max_results": 5, "include_raw_content": True}
    results = []
    for attempt in range(3):
        print(f"[DEBUG] Tavily search attempt {attempt+1}")
        try:
            response = requests.post(api_url, json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                for item in data.get("results", []):
                    results.append({
                        "title": item.get("title", ""),
                        "url": item.get("url", ""),
                        "content": item.get("content", "")
                    })
                break
        except Exception as e:
            print(f"[DEBUG] Tavily search attempt {attempt+1} failed with error: {e}")
            if attempt < 2:
                time.sleep(2)
    print(f"[DEBUG] Tavily search completed with {len(results)} results")
    return results

async def serpapi_search(query: str) -> Any:
    import requests, time  # local import for async context
    print(f"[DEBUG] Starting SerpAPI search for query: {query}")
    api_url = "https://serpapi.com/search"
    params = {
        "q": query,
        "api_key": SERPAPI_API_KEY,
        "engine": "google",
        "num": 5,        # Number of results to return
        "hl": "en"       # Language (optional)
    }
    results = []
    for attempt in range(3):
        print(f"[DEBUG] SerpAPI search attempt {attempt+1}")
        try:
            response = requests.get(api_url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                organic_results = data.get("organic_results", [])
                for item in organic_results:
                    results.append({
                        "title": item.get("title", ""),
                        "url": item.get("link", ""),
                        "content": item.get("snippet", "")
                    })
                break
        except Exception as e:
            print(f"[DEBUG] SerpAPI search attempt {attempt+1} failed with error: {e}")
            if attempt < 2:
                time.sleep(2)
    print(f"[DEBUG] SerpAPI search completed with {len(results)} results")
    return results

# ------------------------------------------------------------------------
# SCHEMAS
# ------------------------------------------------------------------------
class ReportStateInput(TypedDict):
    topic: str  # e.g. "Financial due diligence for Company X"
    headings: List[str]
    index: str
    user_id: str
    project_id: str

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
    print("[DEBUG] Entering answer_questions with state:", state)
    questions = state["questions"]
    index = state["index"]
    user_id = state["user_id"]
    project_id = state["project_id"]

    answers = []

    for question in questions:
        question = question.strip()
        print(f"\n[answer_questions] Received question:\n'{question}'")
        print(f"[answer_questions] Querying index: {index}")

        # Retrieve document search context (if enabled)
        file_context = ""
        if state.get("file_search"):
            file_context_data = query_kb(question, KNOWLEDGE_BASE_ID, user_id, project_id, MODEL_ARN)
            if file_context_data and "output" in file_context_data:
                file_context = file_context_data["output"]
            else:
                file_context = "Empty Document Response"
            print(f"[answer_questions] Document context for '{question}':\n", file_context)

        # Retrieve web search context (if enabled)
        web_context = ""
        if state.get("web_search"):
            web_results = await tavily_search(question)
            if web_results:
                # Combine each result's title, URL, and content
                web_context = "\n\n".join([
                    f"Title: {r['title']}\nURL: {r['url']}\nContent: {r['content']}"
                    for r in web_results
                ])
            else:
                web_context = "Empty Web Response"
            print(f"[answer_questions] Web context for '{question}':\n", web_context)

        # Combine contexts from document and web searches
        combined_context = (file_context + "\n\n" + web_context).strip()
        if not combined_context:
            combined_context = "Empty Response"
        print(f"[answer_questions] Combined context for '{question}':\n", combined_context)

        prompt = f"""
You are a market research analyst. You must answer the following question using ONLY the text from this context:
{combined_context}

Question: {question}

If the context does not have enough info, respond with:
'MISSING INFORMATION: The provided context does not contain details to answer this question.'

Answer:
"""
        print("\n[answer_questions] LLM Prompt:\n", prompt)
        response = await Settings.llm.acomplete(prompt)
        answer_text = response.text if hasattr(response, "text") else str(response)

        print(f"[answer_questions] Answer for '{question}':\n", answer_text)

        # Store the result
        answers.append((question, answer_text))
        print(f"[DEBUG] Answer appended for question: '{question}'")
    
    print("[DEBUG] Exiting answer_questions with answers.")
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

async def generate_structured_report(query: InstructionRequest, user_id: str, project_id: str):
    print("[DEBUG] Entering generate_structured_report with query:", query, "user_id:", user_id, "project_id:", project_id)
    try:
        setup_models()
        index_name = f"d{project_id}".lower()
        print(f"[generate_structured_report] Using index name: {index_name}")

        document_graph = build_document_graph()
        print("[generate_structured_report] Document graph built successfully.")

        input_state = {
            "__start__": {},
            "topic": query.get("query", ""),
            "headings": query.get("headings", []),
            "index": index_name,
            "user_id": user_id,
            "project_id": project_id,
            "previous_questions": [],
            "outline": "",
            "questions": [],
            "answers": [],
            "report": ""
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

langgraph_router = APIRouter()

@langgraph_router.post("/api/lang-report")
async def generate_report(
    query: InstructionRequest,
    current_user: UserModelSerializer = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    print("[DEBUG] Entering generate_report endpoint")
    user_id = current_user.id

    try:
        print(f"[generate_report] Step 1: Received query: {query}")
        print(f"[generate_report] Step 2: Received project_id: {query.project_id}")
        print("[generate_report] Step 3: Validating deal ID and user...")

        deal = db.query(Deal).filter(Deal.id == query.project_id, Deal.user_id == user_id).first()
        if not deal:
            print(f"[generate_report] Deal validation failed for project_id: {query.project_id}")
            raise HTTPException(status_code=404, detail="Deal not found or access denied.")
        
        print("[generate_report] Step 4: Deal validation successful.")
        print("[generate_report] Step 5: Generating structured report...")

        report_content = await generate_structured_report(query, user_id, query.project_id)
        if not report_content:
            print("[generate_report] Step 5.1: Report generation failed.")
            raise HTTPException(status_code=404, detail="Failed to generate report.")
        
        print("[generate_report] Step 6: Report generated successfully.")
        print("[generate_report] Step 7: Saving report to database...")
        try:
            new_report = Report(
                project_id=query.project_id,
                report_data=json.dumps(report_content)
            )
            db.add(new_report)
            db.commit()
            db.refresh(new_report)
            print(f"[generate_report] Step 7.1: Report saved with ID: {new_report.id}")
        except Exception as db_error:
            db.rollback()
            print(f"[generate_report] Step 7.2: Database error: {db_error}")
            raise HTTPException(status_code=500, detail=f"Failed to save report: {str(db_error)}")
        
        print("[DEBUG] Exiting generate_report endpoint with success.")
        return JSONResponse(
            content={
                "message": "Report generated and saved successfully",
                "project_id": str(query.project_id),
                "report_id": str(new_report.id),
                "report": report_content.get("report", ""),
            },
            status_code=200,
        )
    except Exception as e:
        print(f"[generate_report] Error encountered: {str(e)}")
        logerror(f"Error in generate_report: {e}")
        print("[DEBUG] Exiting generate_report endpoint with error.")
        raise HTTPException(status_code=500, detail=str(e))
