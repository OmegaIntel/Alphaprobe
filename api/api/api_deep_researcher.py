import os
import uuid
import asyncio
import operator
import inspect
import json
from typing import List, TypedDict, Any, Optional
from typing_extensions import Annotated
from pydantic import BaseModel, Field
from dataclasses import dataclass, fields
import logging
from fastapi.responses import JSONResponse
from api.api_user import get_current_user

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
import boto3, botocore, uuid
from botocore.config import Config

from langchain_core.runnables import RunnableConfig
from langchain_core.messages import SystemMessage, HumanMessage

# ------------------------------------------------------------------------
# LlamaIndex for loading/creating a vector index and querying
# ------------------------------------------------------------------------
from llama_index.core import Settings, VectorStoreIndex, StorageContext, load_index_from_storage
from llama_parse import LlamaParse
from llama_index.core.query_engine import BaseQueryEngine
from llama_index.embeddings.openai import OpenAIEmbedding

# ------------------------------------------------------------------------
# LangChain + LLM
# ------------------------------------------------------------------------
from langchain_openai import ChatOpenAI
import openai

# ------------------------------------------------------------------------
# langgraph-based StateGraph
# ------------------------------------------------------------------------
from langgraph.constants import Send
from langgraph.graph import START, END, StateGraph

# ------------------------------------------------------------------------
# Prompts 
# 1. Company profile
# 2. Financial Statement Analysis
# 3. Market Sizing
# ------------------------------------------------------------------------
# 1. report_planner_query_writer_instructions
report_planner_query_writer_instructions = [
    """You are an expert financial and industry analyst. Your task is to propose specific search queries that will extract the necessary data to populate an industry report. 
    Query Context: {topic}
    Focus on company profile elements such as management, business models, industry position, financial performance, corporate actions, and news. Incorporate insights from the following tags: Investment Research, Target Screening, Corporate Due Diligence, Competitive Research.
    """,
    """You are an expert financial and industry analyst. Your task is to propose specific search queries that will extract the necessary data to populate an industry report.
    Query Context: {topic}
    Focus on financial statement analysis, including the evaluation of financial health, profitability, liquidity, and solvency. Incorporate analysis angles from the following tags: Financial Analysis, Ratio and Trend Analysis, Portfolio Monitoring, Valuation.
    """,
    """You are an expert financial and industry analyst. Your task is to propose specific search queries that will extract the necessary data to populate an industry report.
    Query Context: {topic}
    Focus on market sizing elements, including market size, segmentation, key players, trends, and competitive dynamics. Incorporate analysis angles from the following tags: Market Research, Business Consulting, Strategy, Marketing.
    """
]

# 2. report_planner_instructions
report_planner_instructions = [
    """You are an expert financial and industry analyst. Based on the topic and the combined relevant content from the local documents, produce a structured outline for an industry report.
Topic: {topic}
Document Context: {context}
This outline should emphasize a comprehensive company profile with detailed overviews of management, business models, industry position, financial performance, corporate actions, and news. Include considerations from the following tags: Investment Research, Target Screening, Corporate Due Diligence, Competitive Research.
    """,
    """You are an expert financial and industry analyst. Based on the topic and the combined relevant content from the local documents, produce a structured outline for an industry report.
Topic: {topic}
Document Context: {context}
This outline should detail a comprehensive financial statement analysis, emphasizing key financial metrics, ratio trends, and valuation insights. Include considerations from the following tags: Financial Analysis, Ratio and Trend Analysis, Portfolio Monitoring, Valuation.
    """,
    """You are an expert financial and industry analyst. Based on the topic and the combined relevant content from the local documents, produce a structured outline for an industry report.
Topic: {topic}
Document Context: {context}
This outline should emphasize market sizing by detailing market size, segmentation, key players, trends, and competitive dynamics. Include considerations from the following tags: Market Research, Business Consulting, Strategy, Marketing.
    """
]

# 3. section_writer_instructions
section_writer_instructions = [
    """You are an expert financial and industry analyst. Draft a very detailed and comprehensive content for the following section of an industry report based on the relevant document excerpts provided. Your content should directly address the data or questions implied by the section and include extended analysis, examples, and additional insights.
Section Title: {section_title}
Section Description: {section_topic}
Relevant Document Excerpts:
{context}
Ensure the analysis reflects deep insights into company management, business models, industry standing, financial performance, corporate actions, and news. Leverage the following tags for focus: Investment Research, Target Screening, Corporate Due Diligence, Competitive Research.
""",
    """You are an expert financial and industry analyst. Draft a very detailed and comprehensive content for the following section of an industry report based on the relevant document excerpts provided. Your content should directly address the data or questions implied by the section and include extended analysis, examples, and additional insights.
Section Title: {section_title}
Section Description: {section_topic}
Relevant Document Excerpts:
{context}
Ensure your analysis delves into financial health, key performance ratios, trend analysis, and valuation techniques. Leverage insights from the following tags: Financial Analysis, Ratio and Trend Analysis, Portfolio Monitoring, Valuation.
""",
    """You are an expert financial and industry analyst. Draft a very detailed and comprehensive content for the following section of an industry report based on the relevant document excerpts provided. Your content should directly address the data or questions implied by the section and include extended analysis, examples, and additional insights.
Section Title: {section_title}
Section Description: {section_topic}
Relevant Document Excerpts:
{context}
Ensure your analysis focuses on market size, segmentation, competitive landscape, and trend analysis. Leverage insights from the following tags: Market Research, Business Consulting, Strategy, Marketing.
"""
]

# 4. final_section_writer_instructions
final_section_writer_instructions = [
    """You are an expert financial and industry analyst. Compile the final sections of the industry report by synthesizing and polishing the content from all completed sections. Produce a comprehensive narrative report of at least 3000 words that includes thorough analysis, detailed examples, and extended insights.
Context from Completed Sections:
{context}
Generate the final, integrated content for the industry report, ensuring that the comprehensive company profile is clearly outlined with details on management, business models, industry position, financial performance, corporate actions, and news. Factor in the following tags: Investment Research, Target Screening, Corporate Due Diligence, Competitive Research.
""",
    """You are an expert financial and industry analyst. Compile the final sections of the industry report by synthesizing and polishing the content from all completed sections. Produce a comprehensive narrative report of at least 3000 words that includes thorough analysis, detailed examples, and extended insights.
Context from Completed Sections:
{context}
Generate the final, integrated content for the industry report, ensuring that the financial statement analysis is clearly outlined with detailed assessments of financial performance, ratios, trends, and valuation methodologies. Factor in the following tags: Financial Analysis, Ratio and Trend Analysis, Portfolio Monitoring, Valuation.
""",
    """You are an expert financial and industry analyst. Compile the final sections of the industry report by synthesizing and polishing the content from all completed sections. Produce a comprehensive narrative report of at least 3000 words that includes thorough analysis, detailed examples, and extended insights.
Context from Completed Sections:
{context}
Generate the final, integrated content for the industry report, ensuring that the market sizing aspects are clearly delineated with insights on market size, player segmentation, competitive trends, and strategic analysis. Factor in the following tags: Market Research, Business Consulting, Strategy, Marketing.
"""
]

# 5. query_prompt_for_iteration (for generating additional queries)
query_prompt_for_iteration = [
    """You are an expert financial analyst. Generate up to 5 queries to find more data for the following section in a manner that deepens the research conducted so far and is likely to return non-empty results from the document index.

Section Description: {description}

Previous Queries and Compiled Answers:
Previous Queries:
{previous_text}
Compiled Answers:
{previous_section_output}

Focus on:
- Key financial details regarding company management and performance
- Specific business models and industry positioning insights
- Relevant corporate actions and recent news
- Extended analysis based on the tags: Investment Research, Target Screening, Corporate Due Diligence, Competitive Research

Ensure that your new queries build upon the previous research and are specific enough to generate valuable document search results.
    """,
    """You are an expert financial analyst. Generate up to 5 queries to find more data for the following section in a manner that deepens the research conducted so far and is likely to return non-empty results from the document index.

Section Description: {description}

Previous Queries and Compiled Answers:
Previous Queries:
{previous_text}
Compiled Answers:
{previous_section_output}

Focus on:
- Detailed financial metrics and ratio analysis
- Identification of trends and historical financial performance
- Insights into portfolio monitoring and valuation practices
- Extended analysis based on the tags: Financial Analysis, Ratio and Trend Analysis, Portfolio Monitoring, Valuation

Ensure that your new queries build upon the previous research and are specific enough to generate valuable document search results.
    """,
    """You are an expert financial analyst. Generate up to 5 queries to find more data for the following section in a manner that deepens the research conducted so far and is likely to return non-empty results from the document index.

Section Description: {description}

Previous Queries and Compiled Answers:
Previous Queries:
{previous_text}
Compiled Answers:
{previous_section_output}

Focus on:
- Key market size metrics and segmentation details
- Analysis of competitive landscape and emerging market trends
- Strategic insights based on the tags: Market Research, Business Consulting, Strategy, Marketing
- Extended analysis on market contours and identification of key players

Ensure that your new queries build upon the previous research and are specific enough to generate valuable document search results.
    """
]

# ------------------------------------------------------------------------
# Logger Config
# ------------------------------------------------------------------------

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("app.log"),
    ],
)

logger = logging.getLogger(__name__)

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
@dataclass(kw_only=True)
class Configuration:
    """The configurable fields for the chatbot."""
    number_of_queries: int = 2
    tavily_topic: str = "general"
    tavily_days: Optional[str] = None
    section_iterations: int = 3  # Increased from 2 to 3 for deeper research

    @classmethod
    def from_runnable_config(
        cls, config: Optional[RunnableConfig] = None
    ) -> "Configuration":
        configurable = (
            config["configurable"] if config and "configurable" in config else {}
        )
        values: dict[str, Any] = {
            f.name: os.environ.get(f.name.upper(), configurable.get(f.name))
            for f in fields(cls)
            if f.init
        }
        return cls(**{k: v for k, v in values.items() if v})

# ------------------- GLOBAL QUERY ENGINE ------------------------
query_engine: BaseQueryEngine = None

def set_query_engine(engine: BaseQueryEngine):
    """
    Store a global reference to a LlamaIndex QueryEngine,
    so that the rest of the code can use it for doc searches.
    """
    global query_engine
    query_engine = engine

# -------------------- BASE STORAGE DIRECTORY ----------------------
BASE_STORAGE_DIR = "./storage"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY

# ------------------------------------------------------------------------
# Build or Load Index for Multiple Documents with Random Persist Folder
# ------------------------------------------------------------------------
async def build_or_load_index_random(
    directory_paths: Any,  # Accepts a single path (str) or a list of paths
    base_storage_dir: str = BASE_STORAGE_DIR,
    rebuild: bool = False
) -> VectorStoreIndex:
    print(f"[DEBUG] Entering build_or_load_index_random")
    if isinstance(directory_paths, str):
        directory_paths = [directory_paths]

    # Generate a random folder name under the base storage directory
    random_folder = os.path.join(base_storage_dir, str(uuid.uuid4()))
    os.makedirs(random_folder, exist_ok=True)
    print(f"[INFO] Using persist directory: {random_folder}")

    # Check if folder is empty; if so, force rebuild
    if not os.listdir(random_folder):
        print(f"[INFO] Folder {random_folder} is empty. Forcing index rebuild.")
        rebuild = True
    else:
        print(f"[DEBUG] Folder {random_folder} contents: {os.listdir(random_folder)}")

    # Try to load the index from storage if not forcing rebuild
    if not rebuild:
        try:
            print(f"[INFO] Attempting to load existing index from storage.")
            storage_context = StorageContext.from_defaults(persist_dir=random_folder)
            index = load_index_from_storage(storage_context)
            print(f"[INFO] Loaded existing index successfully.")
            return index
        except Exception as e:
            print(f"[ERROR] Error loading existing index: {e}. Proceeding to rebuild the index.")

    # Rebuild the index from the documents
    print(f"[INFO] Building a new index from documents...")
    try:
        parser = LlamaParse(
            api_key="llx-Erd0RHKTagtHmXwstTZu9xwEK79mvxIC33Q5LkcHad492MBV",
            result_type="markdown"
        )
        all_documents = []
        for path in directory_paths:
            print(f"[DEBUG] Starting document parsing from: {path}")
            docs = await parser.aload_data(path)
            print(f"[INFO] Parsed {len(docs)} documents from {path} successfully.")
            all_documents.extend(docs)
    except Exception as e:
        print(f"[ERROR] Error parsing documents from {directory_paths}: {e}")
        raise

    try:
        embedding_model = OpenAIEmbedding(model="text-embedding-ada-002")
        print(f"[DEBUG] Creating VectorStoreIndex from parsed documents using the embedding model.")
        index = VectorStoreIndex.from_documents(all_documents, embedding=embedding_model)
        index.storage_context.persist(persist_dir=random_folder)
        print(f"[INFO] Index built and persisted to {random_folder}.")
    except Exception as e:
        print(f"[ERROR] Error building or persisting the index: {e}")
        raise

    print(f"[DEBUG] Exiting build_or_load_index_random")
    return index

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
# S3 HELPERS
# ------------------------------------------------------------------------

def get_presigned_url_from_source_uri(source_uri: str, expiration: int = 3600) -> str:
    """
    Generate a presigned URL from an S3 source_uri.
    
    Parameters:
      - source_uri (str): The S3 URI (e.g. "s3://bucket-name/path/to/object.pdf")
      - expiration (int): The expiration time of the URL in seconds
      
    Returns:
      - str: The presigned URL.
    """
    # Check the format
    if not source_uri.startswith("s3://"):
        raise ValueError("source_uri must start with 's3://'")
    
    # Remove the "s3://" prefix and split into bucket and key
    without_prefix = source_uri.replace("s3://", "")
    parts = without_prefix.split("/", 1)
    if len(parts) != 2:
        raise ValueError("Invalid source_uri format. Expected s3://bucket/key")
    
    bucket, key = parts
    try:
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expiration
        )
        return url
    except Exception as e:
        print(f"Error generating presigned URL: {e}")
        return None

# ------------------------------------------------------------------------
# SCHEMAS
# ------------------------------------------------------------------------
class Section(BaseModel):
    name: str = Field(description="Name for this section of the report.")
    description: str = Field(description="Brief overview of the main topics.")
    research: bool = Field(description="Whether we need to query local docs.")
    content: str = Field(description="The content of this section.", default="")
    citations: List[dict] = Field(default_factory=list, description="List of references/citations used for this section.")

class Sections(BaseModel):
    sections: List[Section] = Field(description="List of sections for the report.")

class SearchQuery(BaseModel):
    search_query: str = Field(..., description="A doc query relevant for the section.")

class Queries(BaseModel):
    queries: List[SearchQuery] = Field(description="List of doc queries.")

class ReportStateInput(TypedDict):
    topic: str  # e.g. "Financial due diligence for Company X"
    user_id: str
    report_type: int
    file_search: bool
    web_search: bool
    project_id: str

class ReportStateOutput(TypedDict):
    final_report: str
    sections: List[Section]

class ReportState(TypedDict, total=False):
    topic: str
    user_id: str
    report_type: int
    file_search: bool
    web_search: bool
    project_id: str
    sections: List[Section]
    completed_sections: Annotated[List[Section], operator.add]
    report_sections_from_research: str
    final_report: str
    reflection_count: int
    reflection_needed: bool

class SectionState(TypedDict):
    section: Section
    report_type: int
    user_id: str
    file_search: bool
    web_search: bool
    project_id: str
    search_queries: List[SearchQuery]
    source_str: str
    report_sections_from_research: str
    completed_sections: List[Section]

class SectionOutputState(TypedDict):
    completed_sections: List[Section]

# ------------------------------------------------------------------------
# LLM Setup
# ------------------------------------------------------------------------
gpt_4 = ChatOpenAI(model="gpt-4o-mini", temperature=0.0, api_key=OPENAI_API_KEY)

# ------------------------------------------------------------------------
# HELPER: Format completed sections
# ------------------------------------------------------------------------
def format_sections(sections: List[Section]) -> str:
    """
    Turn a list of completed sections into a text block for reference.
    """
    out = []
    for idx, sec in enumerate(sections, 1):
        out.append(f"""
============================================================
Section {idx}: {sec.name}
============================================================
Description:
{sec.description}
Needs Research: {sec.research}

Content:
{sec.content if sec.content else '[Not yet written]'}
""")
    return "\n".join(out)

# ------------------------------------------------------------------------
# GRAPH NODES
# ------------------------------------------------------------------------
async def generate_report_plan(state: ReportState, config: RunnableConfig):
    """
    1) Generate an initial set of queries to gather relevant data about the topic from local docs.
    2) Retrieve doc context.
    3) Generate an outline (sections) for the report.
    """
    logger.debug(f"State when entering generate_report_plan: {state}")
    topic = state["topic"]
    report_type = state["report_type"]

    # Step 1: Generate queries (structured response)
    structured_llm_queries = gpt_4.with_structured_output(Queries)
    system_prompt_for_queries = report_planner_query_writer_instructions[report_type].format(topic=topic)

    queries_obj = structured_llm_queries.invoke([
        SystemMessage(content=system_prompt_for_queries),
        HumanMessage(content="Generate a list of doc queries in JSON under 'queries'.")
    ])
    print(f"[DEBUG] Generated queries")

    # Step 2: Query the local documents
    doc_context_list = []
    if query_engine:
        for q in queries_obj.queries:
            resp = query_engine.query(q.search_query)
            doc_context_list.append(f"Query: {q.search_query}\n{str(resp)}\n")
    combined_context = "\n".join(doc_context_list)

    # Step 3: Create sections from that context
    structured_llm_sections = gpt_4.with_structured_output(Sections, method="function_calling")
    system_prompt_for_sections = report_planner_instructions[report_type].format(
        topic=topic,
        context=combined_context
    )

    sections_obj = structured_llm_sections.invoke([
        SystemMessage(content=system_prompt_for_sections),
        HumanMessage(content="Generate the JSON array of sections under 'sections'.")
    ])
    print(f"[DEBUG] Generated report sections")

    return {"sections": sections_obj.sections}

def generate_queries(state: SectionState, config: RunnableConfig):
    """
    For each section, generate up to 5 specialized queries to find more data.
    Only filter out any queries that have already been asked.
    Additionally, include previous queries and their compiled document search outputs
    to ensure that new queries build upon and deepen the research.
    """
    section = state["section"]
    report_type = state["report_type"]
    structured_llm_queries = gpt_4.with_structured_output(Queries)
    
    # Gather previous queries and their compiled answers (if available)
    previous_queries = state.get("previous_queries", [])
    if previous_queries:
        previous_text = "\n".join([f"Q: {pq.search_query}" for pq in previous_queries])
    else:
        previous_text = "None"
    previous_section_output = state.get("source_str", "No previous document search results available.")
    
    prompt = query_prompt_for_iteration[report_type].format(
        description=section.description,
        previous_text=previous_text,
        previous_section_output=previous_section_output
    )
    
    queries_obj = structured_llm_queries.invoke([
        SystemMessage(content=prompt),
        HumanMessage(content="Return 'queries' in JSON.")
    ])
    print(f"[DEBUG] Generated specialized queries for section '{section.name}': {queries_obj}")
    # Filter out queries that have been generated in previous iterations.
    previous = state.get("previous_queries", [])
    unique_queries = [q for q in queries_obj.queries if q.search_query not in [pq.search_query for pq in previous]]
    state.setdefault("previous_queries", []).extend(unique_queries)
    return {"search_queries": unique_queries}

def get_file_name(source_uri: str) -> str:
    """
    Extract the file name from an S3 URI or HTTP URL.
    For S3 URIs (e.g., "s3://bucket-name/path/to/file.pdf"), returns "file.pdf".
    For HTTP URLs, uses the URL path.
    """
    if source_uri.startswith("s3://"):
        parts = source_uri.split("/")
        return parts[-1] if parts else source_uri
    else:
        from urllib.parse import urlparse
        parsed = urlparse(source_uri)
        path = parsed.path
        return path.split("/")[-1] if path else source_uri

def search_document(state: SectionState, config: RunnableConfig):
    search_queries = state["search_queries"]
    user_id = state["user_id"]
    project_id = state["project_id"]
    results = []
    
    # We'll accumulate references from each query here:
    all_citations = []
    
    for sq in search_queries:
        resp = query_kb(sq.search_query, KNOWLEDGE_BASE_ID, user_id, project_id, MODEL_ARN)
        
        # The textual content you had before
        doc_text = f"Query: {sq.search_query}\nResult: {resp['output']}\n"
        
        # Extract citation info if available
        for citation in resp.get("citations", []):
            for reference in citation.get("retrievedReferences", []):
                metadata = reference.get("metadata", {})
                page_number = metadata.get("x-amz-bedrock-kb-document-page-number")
                source_uri = metadata.get("x-amz-bedrock-kb-source-uri")
                chunk_content = reference.get("content", {})
                chunk_text = chunk_content.get("text", "")
                
                # Build a citation entry with the extracted file name for deduplication.
                citation_entry = {
                    "query": sq.search_query,
                    "pageNumber": page_number,
                    "sourceUri": get_presigned_url_from_source_uri(source_uri),
                    "chunk_text": chunk_text,
                    "file_name": get_file_name(source_uri)
                }
                
                # Check if a citation with the same file name and page number is already in the list.
                exists = False
                for cit in all_citations:
                    if citation_entry.get("pageNumber"):
                        # Document citation: compare file name and page number.
                        if cit.get("pageNumber") and cit["file_name"] == citation_entry["file_name"] and cit["pageNumber"] == citation_entry["pageNumber"]:
                            exists = True
                            break
                    else:
                        # Web citation: compare only file name.
                        if cit["file_name"] == citation_entry["file_name"]:
                            exists = True
                            break
                if not exists:
                    all_citations.append(citation_entry)

        results.append(doc_text)
    
    # (Optional) Remove the temporary "file_name" field from each citation before returning.
    unique_citations = []
    for cit in all_citations:
        cit.pop("file_name", None)
        unique_citations.append(cit)
    
    combined = "\n".join(results)
    print(f"[DEBUG] Combined document excerpts for section '{state['section'].name}' with deduplicated citations based on file name.")
    
    # Return both the raw text and the deduplicated citations.
    return {
        "source_str": combined,
        "citations": unique_citations
    }

def write_section(state: SectionState):
    """
    Build the final text for this section from the combined source_str.
    """
    section = state["section"]
    src = state["source_str"]
    report_type = state["report_type"]

    prompt = section_writer_instructions[report_type].format(
        section_title=section.name,
        section_topic=section.description,
        context=src
    )

    response = gpt_4.invoke([
        SystemMessage(content=prompt),
        HumanMessage(content="Draft the content for this section.")
    ])
    # Append a citation to the generated content.
    section.content = response.content
    print(f"[DEBUG] Wrote section '{section.name}'")
    return {"completed_sections": [section]}

async def iterate_section_research(state: SectionState, config: RunnableConfig):
    section_iterations = config.get("section_iterations", 2)
    accumulated_context = ""
    file_search = state["file_search"]
    web_search = state["web_search"]
    
    # We'll track all citations across iterations
    all_citations_for_section = []
    
    for i in range(section_iterations):
        print(f"[DEBUG] Iteration {i+1} for section '{state['section'].name}'")
        
        # 1) Generate specialized queries
        queries_result = generate_queries(state, config)
        state["search_queries"] = queries_result["search_queries"]
        
        # 2) Document search
        if file_search:
            doc_result = search_document(state, config)
            # Accumulate citations from each iteration
            all_citations_for_section.extend(doc_result["citations"])
        else:
            doc_result = {"source_str": "Not searching documents for this request"}
        
        # 3) Web search (optional)
        if web_search:
            web_result = await tavily_search(state["section"].name)
            # You can build citations for web results here if desired
            # e.g. each item in web_result could be appended to all_citations_for_section
            for item in web_result:
                citation_entry = {
                    "query": state["section"].name,
                    "title": item.get("title", ""),
                    "sourceUri": item.get("url", ""),
                    "chunk_text": item.get("content", "")
                }
                all_citations_for_section.append(citation_entry)
        else:
            web_result = "Not searching web for this request"
        
        # Combine textual results
        if isinstance(web_result, list):
            web_result_str = "\n".join([
                f"Title: {r['title']}\nURL: {r['url']}\nContent: {r['content']}"
                for r in web_result
            ])
        else:
            web_result_str = str(web_result)
        
        combined_iteration = (
            f"--- Iteration {i+1} ---\n"
            f"Document Results:\n{doc_result['source_str']}\n\n"
            f"Web Results:\n{web_result_str}\n"
        )
        
        accumulated_context += combined_iteration + "\n"
    
    # Store the combined context in state
    state["source_str"] = accumulated_context
    
    # 4) Draft the final text for this section
    final_output = write_section(state)
    
    # 5) Attach the citations to the section object
    # final_output["completed_sections"] is a list with one item, the updated section
    completed_section = final_output["completed_sections"][0]
    completed_section.citations = all_citations_for_section
    
    return final_output

def gather_completed_sections(state: ReportState):
    """
    After all sections are processed, gather them into a single reference string.
    """
    completed_sections = state.get("completed_sections", [])
    joined = format_sections(completed_sections)
    print(f"[DEBUG] Gathered completed sections")
    return {"report_sections_from_research": joined}

def write_final_sections(state: SectionState):
    """
    For sections that do not require additional doc-based research,
    finalize them by leveraging context from 'report_sections_from_research'.
    This function now expects a single section in state["section"].
    """
    section = state["section"]
    report_type = state["report_type"]
    prompt = final_section_writer_instructions[report_type].format(
        context=state["report_sections_from_research"]
    )
    response = gpt_4.invoke([
        SystemMessage(content=f"Generate the final text for {section.name}: {section.description}"),
        HumanMessage(content=prompt)
    ])
    section.content = response.content
    print(f"[DEBUG] Finalized section '{section.name}' without additional doc research")
    return {"completed_sections": [section]}

def compile_final_report(state: ReportState):
    """
    Combine all sections into a single text block for the final output,
    and return them in a structured format so the frontend can display references.
    """
    # Convert each section in state["sections"] to a Section object
    raw_sections = state["sections"]
    sections = []
    for s in raw_sections:
        if isinstance(s, dict):
            sections.append(Section.parse_obj(s))
        else:
            sections.append(s)
    
    # Similarly, convert completed_sections to Section objects
    raw_completed = state.get("completed_sections", [])
    completed_sections = []
    for s in raw_completed:
        if isinstance(s, dict):
            completed_sections.append(Section.parse_obj(s))
        else:
            completed_sections.append(s)
    
    # Create a mapping from section name to its corresponding completed section
    completed_map = {s.name: s for s in completed_sections}
    print(f"[DEBUG] Completed Map: {completed_map}")

    # Update sections with final content and citations from completed_map
    for s in sections:
        if s.name in completed_map:
            s.content = completed_map[s.name].content
            s.citations = completed_map[s.name].citations
    
    # Build the final report by concatenating the content of each section
    final_report_text = "\n\n".join([sec.content for sec in sections])
    print(f"[DEBUG] Compiled final report")
    
    return {
        "final_report": final_report_text,
        "sections": [s.dict() for s in sections]  # Convert Pydantic models to dict for output
    }

# ------------------------------------------------------------------------
# BUILD THE MAIN GRAPH
# ------------------------------------------------------------------------
builder = StateGraph(
    state_schema=ReportState,
    input=ReportStateInput,
    output=ReportStateOutput,
    config_schema=Configuration
)

# IMPORTANT: Add an edge from START to your first node.
# 1) Generate overall report plan
builder.add_edge(START, "generate_report_plan")
builder.add_node("generate_report_plan", generate_report_plan)

# 2) Iterate research for sections that require doc-based searches
builder.add_node("iterate_section_research", iterate_section_research)

def initiate_section_writing(state: ReportState):
    return [
        Send("iterate_section_research", {
            "section": s,
            "report_type": state["report_type"],
            "file_search": state["file_search"],
            "web_search": state["web_search"],
            "user_id": state["user_id"],
            "project_id": state["project_id"]
        })
        for s in state["sections"]
        if s.research
    ]

builder.add_conditional_edges("generate_report_plan", initiate_section_writing, ["iterate_section_research"])

# 3) Gather completed sections
builder.add_node("gather_completed_sections", gather_completed_sections)
builder.add_edge("iterate_section_research", "gather_completed_sections")

# 4) Finalize sections that do NOT require doc research
builder.add_node("write_final_sections", write_final_sections)

def initiate_final_section_writing(state: ReportState):
    return [
        Send("write_final_sections", {
            "section": s,
            "report_type": state["report_type"],
            "project_id": state["project_id"],
            "report_sections_from_research": state["report_sections_from_research"]
        })
        for s in state["sections"]
        if not s.research
    ]

builder.add_conditional_edges("gather_completed_sections", initiate_final_section_writing, ["write_final_sections"])

# The critical addition: a direct path to compile_final_report
# so that if there are NO non-research sections, we still continue
builder.add_edge("gather_completed_sections", "compile_final_report")

# 5) Compile the final report
builder.add_node("compile_final_report", compile_final_report)
builder.add_edge("write_final_sections", "compile_final_report")
builder.add_edge("compile_final_report", END)

document_graph = builder.compile()

# ------------------------------------------------------------------------
# ROUTER
# ------------------------------------------------------------------------
research_deep_router = APIRouter()

class InstructionRequest(BaseModel):
    instruction: str
    report_type: int 
    file_search:bool
    web_search:bool
    project_id: str

@research_deep_router.post("/api/deep-researcher-langgraph")
async def deep_research_tool(query: InstructionRequest, current_user=Depends(get_current_user)):
    user_id = current_user.id
    input_data = {
        "topic": query.instruction,
        "user_id": user_id,
        "report_type": int(query.report_type),
        "file_search": query.file_search,
        "web_search": query.web_search,
        "project_id": query.project_id
    }
    
    result = await document_graph.ainvoke(input_data)
    
    if result is None:
        print("[ERROR] The state graph returned None. Check the graph flow and node return values.")
        return JSONResponse(content={"message": "No data returned"}, status_code=500)
    else:
        final_report = result.get("final_report", "")
        # 'sections' will have the references
        sections = result.get("sections", [])
        return JSONResponse(
            content={
                "message": "Research generated successfully",
                "data": final_report,
                "sections": sections
            },
            status_code=200
        )


@research_deep_router.post("/api/upload-deep-research")
async def upload_files(files: List[UploadFile] = File(...), current_user=Depends(get_current_user)):
    user_id = current_user.id
    project_id = str(uuid.uuid4())
    results = []
    
    for file in files:
        key = f"{user_id}/{project_id}/{file.filename}"
        try:
            # Upload the file to S3 with metadata
            s3_client.upload_fileobj(
                file.file, 
                BUCKET_NAME, 
                key, 
                ExtraArgs={"Metadata": {"user_id": str(user_id)}}
            )

            # Prepare metadata content
            metadata_dict = {
                "metadataAttributes": {
                    "user_id": str(user_id),
                    "project_id": str(project_id)
                }
            }
            metadata_content = json.dumps(metadata_dict)
            metadata_key = f"{key}.metadata.json"
            
            # Upload the metadata file
            s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=metadata_key,
                Body=metadata_content,
                ContentType='application/json'
            )
        except botocore.exceptions.ClientError as e:
            raise HTTPException(status_code=500, detail=f"Upload to S3 failed for file: {file.filename}")

        results.append({"s3_key": key})

        # Retry ingestion job up to 3 times if it fails
        max_retries = 3
        for attempt in range(1, max_retries + 1):
            try:
                bedrock_client.start_ingestion_job(
                    knowledgeBaseId=KNOWLEDGE_BASE_ID,
                    dataSourceId=DATA_SOURCE_ID,
                    clientToken=str(uuid.uuid4())
                )
                # Ingestion job started successfully, break out of the retry loop.
                break
            except botocore.exceptions.ClientError as e:
                print(f"Ingestion job attempt {attempt} failed for key: {key}")
                print("Error details:", e.response)
                if attempt == max_retries:
                    # After max retries, log and move on.
                    print(f"Max retries reached for key: {key}. Moving on to next file.")
                else:
                    # Wait for a short period before retrying.
                    import time
                    time.sleep(1)
    
    return {"message": "Files uploaded successfully", "files": results, "project_id": project_id}