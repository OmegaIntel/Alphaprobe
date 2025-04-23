import asyncio  # ensure asyncio is imported
import os
import re
from typing import Dict, List, TypedDict, Any, Optional, Tuple, Annotated, Union
import openai
from pydantic import BaseModel, Field
from dataclasses import dataclass, field, fields
from pydantic import create_model

# LangChain imports
from langchain_core.runnables import RunnableConfig
from langchain_core.messages import SystemMessage, HumanMessage

# LlamaIndex for loading/creating a vector index and querying
from llama_index.core.query_engine import BaseQueryEngine

from fuzzywuzzy import fuzz  # For section title matching

# LangChain + LLM
from langchain_openai import ChatOpenAI
import tiktoken
 
# langgraph-based StateGraph
from langgraph.graph import START, END, StateGraph

# Helpers
from utils.pdf_parser import extract_pdf_from_s3, parse_pdf_structure
from utils.excel_utils import extract_excel_index, has_excel_files
from utils.kb_search import query_kb, get_presigned_url_from_source_uri
from utils.websearch_utils import call_tavily_api
from utils.deepseek import DeepSeekWrapper

KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID", "my-knowledge-base")
BUCKET_NAME = os.getenv("BUCKET_NAME", "deep-research-docs")
DATA_SOURCE_ID = os.getenv("DATA_SOURCE_ID", "my-data-source")
MODEL_ARN = os.getenv("MODEL_ARN", "arn:aws:bedrock:my-model")

# ------------------------------------------------------------------------
# Prompts 
# 1. Company profile
# 2. Financial Statement Analysis
# 3. Market Sizing
# ------------------------------------------------------------------------
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

report_planner_instructions = [
    """
You are an expert financial and industry analyst. Based on the topic and combined content, produce a structured outline for an industry report.

Required PDF Sections (MUST INCLUDE VERBATIM):
{pdf_sections}

Additional Context:
Topic: {topic}
Document Context: {context}

Generate an outline that:
1. Preserves all PDF sections exactly as provided.
2. Any new section should not be similar to the already provided sections in the PDF.
3. Adds complementary sections for a comprehensive company profile covering:
   - Management structure
   - Business model analysis  
   - Industry positioning
   - Financial performance highlights
   - Recent corporate actions
   - Relevant news/developments

Tags to incorporate: Investment Research, Target Screening, Corporate Due Diligence, Competitive Research

Output format:
- Output the outline as a JSON array of section objects.
- Each section object must include exactly one key for the section title (use the key "name") and one key for the section description.
- Use the EXACT same section titles from the PDF where applicable.
- Mark new sections with the "[Additional Research]" prefix.
- All section objects must be unique.
- IMPORTANT: Do not include duplicate title fields or multiple values for a section's title.
- Create At most 10 sections
""",
    """
You are an expert financial analyst. Based on the topic and combined content, produce a structured financial analysis outline.

Required PDF Sections (MUST INCLUDE VERBATIM):
{pdf_sections}

Additional Context:
Topic: {topic}
Document Context: {context}

Generate an outline that:
1. Preserves all financial tables/charts from the PDF exactly.
2. Any new section should not be similar to the already provided sections in the PDF.
3. Adds necessary sections for complete analysis, including:
   - Financial health assessment
   - Profitability deep dive  
   - Liquidity analysis
   - Solvency evaluation
   - Ratio trends
   - Valuation methodologies

Tags to incorporate: Financial Analysis, Ratio and Trend Analysis, Portfolio Monitoring, Valuation

Output format:
- Output the outline as a JSON array of section objects.
- Each section object must include exactly one key for the section title (use the key "name") and one key for the section description.
- Keep original PDF section titles unchanged.
- Flag new sections with the "[Additional Analysis]" prefix.
- All section objects must be unique.
- IMPORTANT: Ensure that each section object has only one title value and no duplicate title keys.
- Create At most 10 sections
""",
    """
You are an expert market analyst. Based on the topic and combined content, produce a market sizing report outline.

Required PDF Sections (MUST INCLUDE VERBATIM):
{pdf_sections}

Additional Context:
Topic: {topic}
Document Context: {context}

Generate an outline that:
1. Retains all market data sections from the PDF unchanged.
2. Any new section should not be similar to the already provided sections in the PDF.
3. Expands the report with additional sections covering:
   - Market segmentation analysis
   - Key player benchmarking  
   - Growth trend projections
   - Competitive landscape
   - Emerging market dynamics

Tags to incorporate: Market Research, Business Consulting, Strategy, Marketing

Output format:
- Output the outline as a JSON array of section objects.
- Each section object must include exactly one key for the section title (use the key "name") and one key for the section description.
- Preserve original PDF section titles.
- Mark supplemental sections with the "[Extended Research]" prefix.
- All section objects must be unique.
- IMPORTANT: Each section must contain only one title field; do not output duplicate or multiple values for the section's title.
- Create At most 10 sections
"""
]

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

query_prompt_for_iteration = [
    """You are an expert financial analyst. Generate up to 3 refined queries to deepen research for this section, building on previous findings and addressing any gaps. Prioritize queries likely to return valuable new information.
    Section Context:
    Title: {section_title}
    Description: {description}

    Research History:
    Previous Queries Attempted:
    {previous_queries}
    Responses Received:
    {previous_responses}
    Feedback on Results:
    {feedback}

    Current Focus Areas:
    1. Management effectiveness and compensation alignment with performance
    2. Business model scalability and differentiation factors  
    3. Market share dynamics and competitive moat analysis
    4. Recent M&A activity and capital allocation decisions
    5. ESG factors impacting valuation

    Query Generation Guidelines:
    - Explicitly reference specific data points from previous responses that need expansion
    - Address any unanswered aspects from prior queries
    - Incorporate analyst feedback on missing/depth requirements
    - Maintain focus on: {tags}

    Format Requirements:
    For each query, specify:
    - Data source target (web/kb/excel)
    - Rationale for why this query will yield new insights
    - Connection to previous research thread""",
    """You are an expert financial analyst. Generate up to 3 precision queries to extract deeper financial insights, using prior results as foundation.
    Section Context:  
    Title: {section_title}
    Description: {description}

    Research History:
    Previous Queries Attempted:
    {previous_queries}  
    Responses Received:
    {previous_responses}
    Feedback on Results:
    {feedback}

    Current Focus Areas:
    1. Margin decomposition by product/geography
    2. Working capital cycle trends  
    3. Debt covenant compliance metrics
    4. Non-GAAP reconciliation analysis
    5. Forward-looking guidance accuracy

    Query Generation Guidelines:
    - Cross-reference specific financial metrics needing verification
    - Identify ratio correlations requiring explanation
    - Target periods with anomalous results
    - Incorporate: {tags}

    Format Requirements:
    For each query, specify:
    - Required dataset (income statement/balance sheet/cash flow)
    - Comparison timeframe requested
    - Specific calculation methodology if relevant""",
    """You are an expert market analyst. Develop 3 strategic queries to expand market understanding based on existing data.
    Section Context:
    Title: {section_title}
    Description: {description}

    Research History:
    Previous Queries Attempted:
    {previous_queries}
    Responses Received:  
    {previous_responses}
    Feedback on Results:
    {feedback}

    Current Focus Areas:
    1. TAM/SAM/SOM validation
    2. Customer acquisition cost trends
    3. Regulatory impact analysis  
    4. Technological disruption vectors
    5. Emerging market penetration strategies

    Query Generation Guidelines:
    - Benchmark against competitors mentioned in prior results
    - Identify geographic/service gaps in current data
    - Project growth rates using multiple scenarios  
    - Incorporate: {tags}

    Format Requirements:
    For each query, specify:
    - Geographic/segment specificity
    - Time horizon (historical/forward-looking)
    - Comparator requirements"""
]

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
        print(f"[DEBUG] Loaded Configuration values: {values}")
        return cls(**{k: v for k, v in values.items() if v})

# ------------------- GLOBAL QUERY ENGINE ------------------------
query_engine: BaseQueryEngine = None

def set_query_engine(engine: BaseQueryEngine):
    """
    Store a global reference to a LlamaIndex QueryEngine,
    so that the rest of the code can use it for doc searches.
    """
    print("[DEBUG] Setting global query engine")
    global query_engine
    query_engine = engine

# -------------------- BASE STORAGE DIRECTORY ----------------------
ENC = tiktoken.get_encoding("cl100k_base")
MAX_TOKENS = 400000

# ------------------------------------------------------------------------
# SCHEMAS
# ------------------------------------------------------------------------
class SearchQuery(BaseModel):
    search_query: str = Field(..., description="A doc query relevant for the section.")

class Queries(BaseModel):
    queries: List[SearchQuery] = Field(description="List of doc queries.")

class SourceQueries(BaseModel):
    web_queries: List[str]
    kb_queries: List[str]
    excel_queries: List[str]

class ReportStateInput(TypedDict):
    topic: str  # e.g. "Financial due diligence for Company X"
    user_id: str
    report_type: int
    file_search: bool
    web_search: bool
    project_id: str

class ReportStateOutput(TypedDict):
    final_report: str

class Section(BaseModel):
    name: str = Field(description="Name for this section of the report.")
    description: str = Field(description="Brief overview of the main topics.")
    research: bool = Field(description="Whether we need to query local docs.")
    content: str = Field(description="The content of this section.", default="")

class Sections(BaseModel):
    sections: List[Section] = Field(description="List of sections for the report.")

class DataPoint(BaseModel):
    name: str = Field(..., description="Descriptive name of the metric")
    value: Optional[Union[float, int, str]] = Field(None, description="The numerical value or percentage")
    unit: Optional[str] = Field(None, description="Unit of measurement (%, $, etc.)")
    time_period: Optional[str] = Field(None, description="Time period this applies to (e.g., '2023', 'Q1 2024')")
    source: Optional[str] = Field(None, description="Source of the data point")
    significance: Optional[str] = Field(None, description="Why this data point matters to the analysis")
    trend: Optional[str] = Field(
        None,
        description="Trend direction if available (up/down/stable)",
        choices=["up", "down", "stable"]
    )
    comparison: Optional[Dict[str, Union[float, str]]] = Field(
        None,
        description="Comparison data (industry avg, competitor, etc.)"
    )
    data_type: Optional[str] = Field(
        None,
        description="Type of financial data",
        choices=[
            "revenue", "profit", "margin", "growth_rate", 
            "market_share", "valuation", "ratio", "other"
        ]
    )

class SectionContent(BaseModel):
    content: str
    data_points: Optional[List[DataPoint]] = Field(
        default_factory=list,
        description="Key numerical findings extracted from research"
    )
    key_takeaways: List[str] = Field(
        default_factory=list,
        description="3-5 main conclusions from this section"
    )
    further_research: bool = Field(
        default=False,
        description="Whether additional research is needed"
    )

@dataclass
class ReportConfig:
    use_tavily: bool = True
    use_serpapi: bool = False
    use_perplexity: bool = True
    perplexity_api_key: Optional[str] = None
    retain_temp_files: bool = False
    section_iterations: int = 2
    web_research: bool = True
    file_search: bool = True
    excel_search: bool = False

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

@dataclass
class ExcelCitation(Citation):
    file_name: str
    sheet: str
    row: int
    col: str
    value: str

@dataclass
class SearchResult:
    citations: List[Citation]  # For UI display
    context_text: str         # For LLM content generation
    original_queries: List[str]

# Modify SectionState to use annotated fields for concurrent updates
@dataclass
class SectionState:
    title: str  # Prevent concurrent updates from overwriting title.
    web_research: bool
    excel_search: bool
    kb_search: bool
    report_type: Annotated[int, lambda old, new: old]
    description: str = ""
    # Annotated fields for concurrent writes
    web_results: Annotated[Optional[List[SearchResult]], lambda x, y: x + [y]] = field(default_factory=list)  # type: ignore
    excel_results: Annotated[Optional[List[SearchResult]], lambda x, y: x + [y]] = field(default_factory=list)  # type: ignore
    kb_results: Annotated[Optional[List[SearchResult]], lambda x, y: x + [y]] = field(default_factory=list)  # type: ignore
    citations: Annotated[List[Citation], lambda x, y: x + y] = field(default_factory=list)  # type: ignore
    context: Annotated[List[str], lambda x, y: x + [y]] = field(default_factory=list) # type: ignore
    # Regular fields
    content: str = ""
    report_state: Any = None
    queries: List[SearchQuery] = field(default_factory=list)
    attempts: int = 0
    excel_queries: List[str] = field(default_factory=list)
    web_queries: List[str] = field(default_factory=list)
    kb_queries: List[str] = field(default_factory=list)

@dataclass
class ReportState:
    topic: str
    user_id: str
    project_id: str
    report_type: int
    file_search: bool
    web_research: bool
    config: ReportConfig = field(default_factory=ReportConfig)
    outline: List[SectionState] = field(default_factory=list)
    current_section_idx: int = 0
    final_report: str = ""

# ------------------------------------------------------------------------
# LLM Setup
# ------------------------------------------------------------------------
OPENAI_API_KEY= os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY

print("[DEBUG] Initializing ChatOpenAI with model o4-mini")
gpt_4 = ChatOpenAI(model="gpt-4o-mini", temperature=0.0, api_key=OPENAI_API_KEY, model_kwargs={"parallel_tool_calls": False} )

# ------------------------------------------------------------------------
# HELPER: Format completed sections, Call llm
# ------------------------------------------------------------------------
CITATIONS: List[Citation] = []

def similar(a: str, b: str) -> bool:
    print(f"[DEBUG] Comparing titles: '{a}' and '{b}'")
    a = a.lower().replace('_', ' ').replace('-', ' ')
    b = b.lower().replace('_', ' ').replace('-', ' ')
    result = a in b or b in a or fuzz.ratio(a, b) > 70
    print(f"[DEBUG] Similarity result: {result}")
    return result

def validate_outline_against_pdf(outline_sections, pdf_sections):
    """Ensure all PDF sections are included"""
    print("[DEBUG] Validating outline against PDF sections")
    pdf_titles = {sec['title'].lower() for sec in pdf_sections}
    missing_sections = []
    
    for title in pdf_titles:
        if not any(title in sec.name.lower() for sec in outline_sections):
            missing_sections.append(title)
            
    if missing_sections:
        print(f"[WARNING] Missing PDF sections: {missing_sections}")
        # Add missing sections with placeholder content
        for title in missing_sections:
            outline_sections.append(Section(
                name=title,
                description=f"Placeholder for required PDF section: {title}",
            ))
    print("[DEBUG] Validation complete")
    return outline_sections

def flatten_context(data):
    """
    Recursively flatten a nested list structure.
    Returns a flat list of strings.
    """
    flat = []
    if isinstance(data, list):
        for item in data:
            flat.extend(flatten_context(item))
    else:
        flat.append(str(data))
    return flat

def convert_to_section_state(base_state: ReportState, data: dict) -> SectionState:
    """Convert dictionary to SectionState with all required fields"""
    return SectionState(
        title=data.get('title', base_state.outline[base_state.current_section_idx].title),
        web_research=data.get('web_research', base_state.web_research),
        excel_search=data.get('excel_search', base_state.config.excel_search),
        kb_search=data.get('kb_search', base_state.file_search),
        report_type=data.get('report_type', base_state.report_type),
        # Optional fields
        description=data.get('description', ''),
        web_results=data.get('web_results', []),
        excel_results=data.get('excel_results', []),
        kb_results=data.get('kb_results', []),
        citations=data.get('citations', []),
        context=data.get('context', []),
        content=data.get('content', ''),
        report_state=base_state,
        queries=data.get('queries', []),
        attempts=data.get('attempts', 0),
        excel_queries=data.get('excel_queries', []),
        web_queries=data.get('web_queries', []),
        kb_queries=data.get('kb_queries', [])
    )

def trim_to_tokens(text: str, max_tokens: int = MAX_TOKENS) -> str:
    tokens = ENC.encode(text)
    if len(tokens) <= max_tokens:
        return text
    # Keep the first N tokens and decode back
    return ENC.decode(tokens[:max_tokens])

# =============================================================================
# SEARCH FUNCTIONS
# =============================================================================
async def parallel_excel_search(report_state: ReportState, queries: List[str]) -> SearchResult:
    """Asynchronously search Excel files with section-specific queries."""
    print("[DEBUG] Entering parallel_excel_search")
    if not report_state.config.excel_search:
        print("[DEBUG] Excel search disabled in config")
        return SearchResult(context_text="", citations=[], original_queries=queries)

    index = extract_excel_index(report_state.user_id, report_state.project_id)
    if not index:
        print("[DEBUG] No Excel index found")
        return SearchResult(context_text="", citations=[], original_queries=queries)

    citations = []
    context_parts = []

    # Worker to run each query in thread
    def _search(sq: str):
        query_engine = index.as_query_engine()
        resp = query_engine.query(sq)
        return sq, resp

    tasks = [asyncio.to_thread(_search, sq) for sq in queries]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for res in results:
        if isinstance(res, Exception):
            print(f"[DEBUG] Excel task failed: {res}")
            continue
        sq, excel_resp = res
        print(f"[DEBUG] Excel result for query: {sq}")
        for node in excel_resp.source_nodes:
            meta = node.metadata
            cit = ExcelCitation(
                file_name=meta.get("file_name", "unknown"),
                sheet=meta.get("sheet", "unknown"),
                row=meta.get("row", 0),
                col=meta.get("col", "unknown"),
                value=node.text
            )
            CITATIONS.append(cit)
            citations.append(cit)
        context_parts.append(f"Excel Search Answer for '{sq}':\n{excel_resp}")

    combined = "\n\n".join(context_parts)
    return SearchResult(citations=citations, context_text=combined, original_queries=queries)

async def parallel_web_search(report_state: ReportState, queries: List[str]) -> SearchResult:
    """Asynchronously search web using Tavily for each query."""
    print("[DEBUG] Entering parallel_web_search")
    if not report_state.config.web_research:
        print("[DEBUG] Web research disabled in config")
        return SearchResult(citations=[], context_text="", original_queries=queries)

    citations = []
    context_parts = []

    tasks = [asyncio.to_thread(call_tavily_api, sq) for sq in queries]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for sq, res in zip(queries, results):
        if isinstance(res, Exception):
            print(f"[DEBUG] Web task failed for '{sq}': {res}")
            continue
        print(f"[DEBUG] Web results for query: {sq}")
        for r in res:
            cit = WebCitation(
                title=r.get("title", "Unknown Source"),
                url=r.get("url", ""),
                snippet=r.get("content", r.get("snippet", ""))
            )
            CITATIONS.append(cit)
            citations.append(cit)
            context_parts.append(f"Web Result for '{sq}': {cit.title}\n{cit.snippet}")

    combined = "\n\n---\n\n".join(context_parts)
    return SearchResult(citations=citations, context_text=combined, original_queries=queries)

async def parallel_kb_query(report_state: ReportState, queries: List[str]) -> SearchResult:
    """Asynchronously query knowledge base for each query."""
    print("[DEBUG] Entering parallel_kb_query")
    citations = []
    context_parts = []

    # Worker to run KB query
    def _kb(sq: str):
        resp = query_kb(sq, KNOWLEDGE_BASE_ID, report_state.user_id, report_state.project_id, MODEL_ARN)
        return sq, resp

    tasks = [asyncio.to_thread(_kb, sq) for sq in queries]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for res in results:
        if isinstance(res, Exception):
            print(f"[DEBUG] KB task error: {res}")
            continue
        sq, resp = res
        text = resp.get('output', {}).get('text', 'No results found')
        print(f"[DEBUG] KB answer for '{sq}': {text[:30]}")
        context_parts.append(f"Knowledge Base Answer for '{sq}':\n{text}")

        for cobj in resp.get("citations", []):
            for ref in cobj.get("retrievedReferences", []):
                cit = KBCitation(
                    chunk_text=ref.get("content", {}).get("text", ""),
                    page=ref.get("metadata", {}).get("x-amz-bedrock-kb-document-page-number"),
                    file_name=os.path.basename(ref.get("metadata", {}).get("x-amz-bedrock-kb-source-uri", "")),
                    url=get_presigned_url_from_source_uri(ref.get("metadata", {}).get("x-amz-bedrock-kb-source-uri", ""))
                )
                CITATIONS.append(cit)
                citations.append(cit)
                print("[DEBUG] Added KB citation")

    combined = "\n\n".join(context_parts)
    return SearchResult(citations=citations, context_text=combined, original_queries=queries)


# =============================================================================
# GRAPH NODES
# =============================================================================
async def node_generate_outline(state: ReportState):
    """Generate report outline from PDF in S3 using structured LLM calls.
    
    If PDF sections are found, use them directly to create the outline without further KB or web searches.
    Otherwise, perform KB search and LLM outline generation.
    """
    print(f"[DEBUG] Entering node_generate_outline for topic: {state.topic}")

    # 1. Download and parse PDF from S3.
    pdf_text = await extract_pdf_from_s3(state.user_id, state.project_id)
    print(f"[DEBUG] PDF text length: {len(pdf_text) if pdf_text else 0}")
    
    pdf_sections = []
    if pdf_text:
        pdf_sections = parse_pdf_structure(pdf_text)
        print(f"[DEBUG] Parsed {len(pdf_sections)} PDF sections")
    else:
        default = await extract_pdf_from_s3("default", "outline")
        if default:
            pdf_sections = parse_pdf_structure(default)
            print(f"[DEBUG] Parsed {len(pdf_sections)} PDF sections")

    # ---------------------------------------
    # CASE 1: PDF sections exist – use them as-is.
    # ---------------------------------------
    if pdf_sections:
        print("[DEBUG] PDF sections found. Using them directly to create outline without KB or web search.")
        for sec in pdf_sections:
            title = sec.get("title", "Untitled Section")
            content = sec.get("content", "")
            # Use the first 200 characters as a brief description (if desired)
            description = content[:200] if content else ""
            new_section_state = SectionState(
                title=title,
                description=description,
                content=content,
                report_state=state,
                # Maintain original configuration values
                web_research=state.config.web_search if hasattr(state.config, "web_search") else False,
                excel_search=state.config.file_search if hasattr(state.config, "file_search") else False,
                kb_search=state.config.file_search if hasattr(state.config, "file_search") else False,
                report_type=state.report_type
            )
            state.outline.append(new_section_state)
            print(f"[DEBUG] Created outline section from PDF: {new_section_state.title} (Total sections: {len(state.outline)})")
        print(f"[DEBUG] Exiting node_generate_outline with {len(state.outline)} sections created from PDF.")
        return state

    # ---------------------------------------
    # CASE 2: No PDF sections – perform KB search and generate outline via LLM.
    # ---------------------------------------
    print("[DEBUG] No PDF sections found. Proceeding with KB search and LLM outline generation.")
    
    # Generate queries (structured response) to find content using KB search.
    structured_llm_queries = gpt_4.with_structured_output(Queries, method="function_calling" )
    system_prompt_for_queries = report_planner_query_writer_instructions[state.report_type].format(topic=state.topic)
    print(f"[DEBUG] System prompt for queries prepared")
    
    queries_obj = structured_llm_queries.invoke([
        SystemMessage(content=trim_to_tokens(system_prompt_for_queries)),
        HumanMessage(content="Generate a list of doc queries in JSON under 'queries'.")
    ])
    print(f"[DEBUG] Generated queries: {queries_obj.queries}")

    # Query the local documents (KB search) for each generated query.
    doc_context_list = []
    for q in queries_obj.queries:
        print(f"[DEBUG] Querying KB with query: {q.search_query}")
        resp = query_kb(q.search_query, KNOWLEDGE_BASE_ID, state.user_id, state.project_id, MODEL_ARN)
        output_text = resp.get('output', {}).get('text', 'No results found')
        doc_text = f"Query: {q.search_query}\nResult: {output_text}\n"
        doc_context_list.append(doc_text)
    combined_context = "\n".join(doc_context_list)
    print(f"[DEBUG] Combined context from KB queries generated")

    # Since no PDF sections, prepare an empty prompt for PDF sections text.
    pdf_sections_text = ""
    print(f"[DEBUG] No PDF sections text prepared (empty)")

    # Create sections from context using LLM.
    structured_llm_sections = gpt_4.with_structured_output(Sections, method="function_calling" )
    outline_prompt = report_planner_instructions[state.report_type].format(
        topic=state.topic,
        context=combined_context,
        pdf_sections=pdf_sections_text
    )
    print(f"[DEBUG] Outline prompt prepared: {outline_prompt[:200]}...")

    sections_obj = structured_llm_sections.invoke([
        SystemMessage(content=trim_to_tokens(outline_prompt)),
        HumanMessage(content="Generate the JSON array of sections under 'sections'.")
    ])
    print(f"[DEBUG] Sections generated by LLM")

    # Validate outline against PDF sections. Here, pdf_sections is empty, so the validator should handle it gracefully.
    sections_obj.sections = validate_outline_against_pdf(
        sections_obj.sections,
        pdf_sections
    )
    print(f"[DEBUG] Outline after validation has {len(sections_obj.sections)} sections")

    # Convert the generated sections into SectionState objects.
    for section in sections_obj.sections:
        # Since there are no PDF sections, we set content as empty.
        new_section_state = SectionState(
            title=section.name,
            description=section.description,
            content="",
            report_state=state,
            web_research=state.config.web_search if hasattr(state.config, "web_search") else False,
            excel_search=state.config.excel_search if hasattr(state.config, "excel_search") else False,
            kb_search=state.config.file_search if hasattr(state.config, "file_search") else False,
            report_type=state.report_type
        )
        state.outline.append(new_section_state)
        print(f"[DEBUG] Created outline section from LLM: {new_section_state.title} (Total sections: {len(state.outline)})")

    print(f"[DEBUG] Exiting node_generate_outline with {len(state.outline)} sections created (via KB & LLM).")
    return state



async def node_process_section(state: ReportState):
    print(f"[DEBUG] Processing section index: {state.current_section_idx}")
    
    # Get current section
    current_section = state.outline[state.current_section_idx]
    
    # Initialize section state
    section_state = SectionState(
        title=current_section.title,
        web_research=state.web_research,
        excel_search=state.config.excel_search,
        kb_search=state.file_search,
        report_type=state.report_type,
        description=current_section.description,
        report_state=state
    )
    
    # Process section
    processed_data = await section_subgraph_compiled.ainvoke(section_state)
    
    # Convert back to SectionState if needed
    if isinstance(processed_data, dict):
        processed_state = convert_to_section_state(state, processed_data)
    else:
        processed_state = processed_data
    
    # Generate content
    await generate_section_content(state, processed_state)
    
    # Retry logic
    for attempt in range(state.config.section_iterations):
        success, feedback = evaluate_section(current_section)
        if success:
            break
            
        print(f"[RETRY] Researching section (Attempt {attempt+1})")
        processed_data = await section_subgraph_compiled.ainvoke(processed_state)
        if isinstance(processed_data, dict):
            processed_state = convert_to_section_state(state, processed_data)
        await generate_section_content(state, processed_state)
    
    # Update state
    state.current_section_idx += 1
    return state

def node_compile_final(state: ReportState):
    """Compile all sections into final report"""
    print(f"[DEBUG] Entering node_compile_final, compiling final report with {len(state.outline)} sections")
    out = []
    for i, sec in enumerate(state.outline, start=1):
        print(f"[DEBUG] Compiling section {i}: {sec.title}")
        out.append(f"## {i}. {sec.title}\n\n{sec.content.strip()}\n")
    state.final_report = "\n".join(out)
    print(f"[DEBUG] Final report compiled")
    return state

# =============================================================================
# SUB-GRAPH NODES
# =============================================================================
def node_section_data_needs(state: SectionState):
    """Determine what data this specific section needs"""
    print(f"[DEBUG] Entering node_section_data_needs for section: {state.title}")
    determine_section_queries(state)
    print(f"[DEBUG] Exiting node_section_data_needs for section: {state.title}")
    return state

async def node_parallel_search(state: SectionState) -> SectionState:
    tasks = []
    if state.excel_queries:
        tasks.append(parallel_excel_search(state.report_state, state.excel_queries))
    if state.web_queries:
        tasks.append(parallel_web_search(state.report_state, state.web_queries))
    if state.kb_queries:
        tasks.append(parallel_kb_query(state.report_state, state.kb_queries))

    results = await asyncio.gather(*tasks, return_exceptions=True)
    for res in results:
        if not isinstance(res, Exception):
            state.citations.extend(res.citations)
            state.context.append(res.context_text)
    return state

async def node_section_excel_search(state: SectionState):
    print(f"[DEBUG] Entering node_section_excel_search for section: {state.title}")
    if len(state.excel_queries) > 0:
        results = await parallel_excel_search(state.report_state, state.excel_queries)
        print(f"[DEBUG] Excel search returned results for section {state.title}")
        state.excel_results.append(results)
        state.citations.extend(results.citations)
        state.context.append(results.context_text)
        return {
            "excel_results": [results],
            "citations": results.citations,
            "context": results.context_text 
        }
    print(f"[DEBUG] No Excel queries or Excel search disabled for section: {state.title}")
    return {}

async def node_section_web_search(state: SectionState):
    print(f"[DEBUG] Entering node_section_web_search for section: {state.title}")
    if len(state.web_queries) > 0:
        results = await parallel_web_search(state.report_state, state.web_queries)
        print(f"[DEBUG] Web search returned results for section {state.title}")
        state.web_results.append(results)
        print(f"[DEBUG] Appended web results")
        state.citations.extend(results.citations)
        print(f"[DEBUG] Extended citations")
        state.context.append(results.context_text)
        print(f"[DEBUG] Appended context")
        return {
            "web_results": [results],  # Return the object directly
            "citations": results.citations,
            "context": results.context_text  # String, not list
        }
    print(f"[DEBUG] No Web queries or Web research disabled for section: {state.title}")
    return {}

async def node_section_kb_search(state: SectionState):
    print(f"[DEBUG] Entering node_section_kb_search for section: {state.title}")

    if len(state.kb_queries) > 0:
        results = await parallel_kb_query(state.report_state, state.kb_queries)
        print(f"[DEBUG] Knowledge Base search returned results for section {state.title}")
        state.kb_results.append(results)
        state.citations.extend(results.citations)
        state.context.append(results.context_text)
        return {
            "kb_results": [results],  # Return the object directly
            "citations": results.citations,
            "context": results.context_text  # String, not list
        }
    print(f"[DEBUG] No KB queries or File search disabled for section: {state.title}")
    return {}

def node_merge_section_data(state: SectionState) -> SectionState:
    """Bulletproof merge handling all possible input formats"""
    print(f"[DEBUG] Entered node merge section for section {state.title}")
    
    def ensure_list(item: Any) -> List:
        if item is None:
            return []
        if isinstance(item, list):
            return item
        return [item]
    
    # Normalize all inputs to lists
    excel_results = ensure_list(state.excel_results)
    web_results = ensure_list(state.web_results)
    kb_results = ensure_list(state.kb_results)
    context = ensure_list(state.context)
    
    # Process context - flatten nested lists
    flat_context = []
    for item in context:
        if isinstance(item, list):
            flat_context.extend([x for x in item if isinstance(x, str)])
        elif isinstance(item, str):
            flat_context.append(item)
    
    # Instead of only pulling from result lists, start with existing state.citations.
    all_citations = list(state.citations)
    for result in excel_results + web_results + kb_results:
        if hasattr(result, 'citations'):
            all_citations.extend(result.citations)
    
    # Process content similarly
    content_parts = []
    for result in excel_results + web_results + kb_results:
        if hasattr(result, 'context_text'):
            content_parts.append(result.context_text)
    
    # Update state
    state.context = "\n\n---\n\n".join(flat_context)
    state.citations = all_citations
    state.content = "\n\n".join(content_parts)
    print(f"[DEBUG] Exiting node_merge_section_data for section {state.title}")
    return state

# =============================================================================
# SECTION PROCESSING
# =============================================================================
def determine_section_queries(state: SectionState) -> SectionState:
    """
    Generate targeted queries for all enabled data sources.
    """
    print(f"[DEBUG] Entering determine_section_queries for section: {state.title}")
    print(f"CONFIG: Web={state.web_research}, KB={state.kb_search}, Excel={state.excel_search}")
    # Debug current search settings
    print(f"[DEBUG] Current search settings - Web: {state.web_research}, KB: {state.kb_search}, Excel: {state.excel_search}")
    
    # Build dynamic model fields
    fields = {}
    if state.web_research:
        fields["web_queries"] = (List[str], Field(default_factory=list, description="Web search queries"))
    if state.kb_search:
        fields["kb_queries"] = (List[str], Field(default_factory=list, description="Knowledge base queries"))
    if state.excel_search:
        fields["excel_queries"] = (List[str], Field(default_factory=list, description="Excel data queries"))

    if not fields:
        print(f"[DEBUG] No search enabled for section: {state.title}")
        return state

    # Create model with explicit field descriptions
    DynamicQueries = create_model("DynamicQueries", **fields)

    print(f"Dynamic model fields: {DynamicQueries.model_computed_fields}")
    # Build enhanced prompt
    prompt_template = query_prompt_for_iteration[state.report_type]
    
    # Create source-specific instructions
    source_instructions = []
    if state.web_research:
        source_instructions.append("WEB RESEARCH: Find recent market data, trends, and competitive intelligence")
    if state.kb_search:
        source_instructions.append("KNOWLEDGE BASE: Search internal documents, reports, and proprietary research")
    if state.excel_search:
        source_instructions.append("EXCEL DATA: Query financial spreadsheets for metrics, ratios, and historical data")
    
    enhanced_instruction = (
        "\nGENERATE QUERIES FOR:\n" + "\n".join(f"- {s}" for s in source_instructions) +
        "\nFORMAT: Return exactly 10 as given in the GENERATE QUERIES instruction."
    )
    
    formatted_prompt = prompt_template.format(
        section_title=state.title,
        description=state.description,
        previous_queries="\n".join([f"- {q}" for q in (state.web_queries + state.kb_queries + state.excel_queries)]),
        previous_responses=state.content if state.content else "No responses yet",
        feedback=state.feedback if hasattr(state, 'feedback') else "No specific feedback yet",
        tags=report_planner_instructions[state.report_type].split("Tags to incorporate:")[1].split("\n")[0].strip()
    ) + enhanced_instruction
    
    print(f"[DEBUG] Full prompt:\n{formatted_prompt}")
    
    # Create structured LLM caller
    structured_llm = gpt_4.with_structured_output(
        DynamicQueries,
        method="function_calling",
        include_raw=False
    )
    
    try:
        queries_obj = structured_llm.invoke([
            SystemMessage(content="You are an expert research analyst. Generate precise queries for ALL enabled data sources."),
            HumanMessage(content=trim_to_tokens(formatted_prompt))
        ])
        print(f"[DEBUG] Received queries object: {queries_obj}")
        
        # Process all enabled query types
        if state.web_research:
            state.web_queries.extend(getattr(queries_obj, "web_queries", []))[:5]
            print(f"[DEBUG] Added {len(state.web_queries)} web queries")
        
        if state.kb_search:
            state.kb_queries.extend(getattr(queries_obj, "kb_queries", []))[:5]
            print(f"[DEBUG] Added {len(state.kb_queries)} KB queries")
        
        if state.excel_search:
            state.excel_queries.extend(getattr(queries_obj, "excel_queries", []))[:5]
            print(f"[DEBUG] Added {len(state.excel_queries)} Excel queries")
            
    except Exception as e:
        print(f"[ERROR] Query generation failed: {str(e)}")
        # Fallback queries with more specific examples
        if state.web_research:
            state.web_queries.extend([
                f"Latest financial performance metrics for {state.title}",
                f"Current market trends affecting {state.title}",
                f"Competitive analysis of {state.title} vs industry peers",
                f"Regulatory changes impacting {state.title}",
                f"Recent news and developments about {state.title}"
            ])
        
        if state.kb_search:
            state.kb_queries.extend([
                f"Internal reports on {state.title} financials",
                f"Proprietary research about {state.title} market position",
                f"Historical performance data for {state.title}",
                f"Analyst assessments of {state.title} business model",
                f"Strategic documents mentioning {state.title}"
            ])
        
        if state.excel_search:
            state.excel_queries.extend([
                f"{state.title} revenue by product line last 5 years",
                f"{state.title} quarterly EBITDA margins",
                f"{state.title} working capital ratios historical data",
                f"{state.title} capex vs opex breakdown",
                f"{state.title} regional sales performance"
            ])
    
    print(f"[DEBUG] Final queries - Web: {state.web_queries}, KB: {state.kb_queries}, Excel: {state.excel_queries}")
    return state

async def generate_section_content(state: ReportState, section_state: Union[SectionState, dict]) -> SectionState:
    """Generate structured section content using collected research data"""
    print("[DEBUG] Entering Generate Section Content")
    
    # Convert dict-like input to proper SectionState
    if isinstance(section_state, dict):
        section_state = SectionState(
            title=section_state.get('title'),
            web_research=section_state.get('web_research'),
            excel_search=section_state.get('excel_search'),
            kb_search=section_state.get('kb_search'),
            report_type=section_state.get('report_type'),
            description=section_state.get('description', ''),
            web_results=section_state.get('web_results'),
            excel_results=section_state.get('excel_results'),
            kb_results=section_state.get('kb_results'),
            citations=section_state.get('citations', []),
            context=section_state.get('context', ''),
            content=section_state.get('content', ''),
            report_state=state,
            queries=section_state.get('queries', []),
            attempts=section_state.get('attempts', 0),
            excel_queries=section_state.get('excel_queries', []),
            web_queries=section_state.get('web_queries', []),
            kb_queries=section_state.get('kb_queries', [])
        )
    
    section = state.outline[state.current_section_idx]
    section_state.attempts += 1
    print(f"[DEBUG] Entering generate_section_content for section: {section.title} (Attempt {section_state.attempts})")

    # Combine context from all sources
    # Combine context from all sources - PROPERLY HANDLE LIST CASE
    raw_context = section_state.context if hasattr(section_state, 'context') else []
    
    # Convert context to string whether it's a list or single value
    if isinstance(raw_context, list):
        context_text = "\n\n---\n\n".join(str(item) for item in raw_context if item)
    else:
        context_text = str(raw_context) if raw_context else "No additional context"
    
    # Now safely trim tokens
    try:
        context_llm_text = trim_to_tokens(context_text)
    except Exception as e:
        print(f"[ERROR] Token trimming failed: {str(e)}")
        context_llm_text = context_text[:8000]  # Fallback simple truncation
    print(f"[DEBUG] Combined context for section: {section.title}")

    # Create structured LLM caller - make sure SectionContent model has data_points as optional
    structured_llm = gpt_4.with_structured_output(SectionContent, method="function_calling")

    # Generate the content
    try:
        section_content = await structured_llm.ainvoke([
            SystemMessage(content=f"""
            You are a senior financial analyst writing detailed report sections.
            Report Topic: {state.topic}
            """),
            HumanMessage(content=f"""
            Generate comprehensive content for this report section using clear formatting guidelines.

            Title: {section.title}
            Description: {section.description}
            Research Context:
            {context_llm_text}

            Requirements:
            1. The narrative should be between 300-500 words and provide clear analysis.
            2. Extract key numbers/statistics
            3. Include all relevant data points (ensure each data point includes a valid value, e.g., a number or a string; do not leave it null)
            4. **Table Formatting:**  
            - If any tables are included in the output, format them using standard markdown table syntax with a header row and a separator (e.g., using pipes and dashes).  
            - Ensure that any narrative text following a table starts on a new line, outside the table block. For example, after the markdown table, include a clear paragraph break before additional text.
            5. Use clear paragraph breaks to separate different types of content (e.g., tables versus narrative text).
            
            Please present:

            1. A **short closing paragraph** (no “### Conclusion” heading, just a clean paragraph).
            2. Up to five **key takeaways** as a bulleted list (no extra heading).
            3. A **markdown table** of your data points, with these columns: Metric, Value, Unit, Period, Source, Significance, Trend.

            Do *not* emit any JSON.  Just pure markdown.

            Please make sure that any text meant to appear after a table is not mistakenly merged into the table itself.

            IMPORTANT: The 'value' for each data point must be non-null. And no extra heading for any of the sub-sections generated through llms
            """)
        ])
        
        print(f"[DEBUG] LLM generated section content successfully")
        
        # Update section with results
        if hasattr(section_content, 'content'):
            section.content += section_content.content
        else:
            section.content += "Content generated but no content field returned"
            
        print(f"[DEBUG] generate_section_content Section Content {section.content}")
        print(f"[SUCCESS] Generated structured content for section: {section.title}")
    except Exception as e:
        print(f"[ERROR] LLM call failed for section {section.title}: {str(e)}")
        section.content = f"Content generation failed: {str(e)}"

    print(f"[DEBUG] Exiting generate_section_content for section: {section.title}")
    return section_state

def evaluate_section(section: SectionState) -> Tuple[bool, str]:
    print(f"[DEBUG] Evaluating section: {section.title}")
    txt = section.content
    fails = []
    words = txt.split()
    print(f"[DEBUG] generate_section_content Section Content {txt}")
    if len(words) < 120:
        fails.append(f"- Too short: {len(words)} words.")
    placeholders = ["TBD", "???", "placeholder"]
    if any(p in txt for p in placeholders):
        fails.append("- Found placeholder text.")
    lower_title = section.title.lower()
    if any(k in lower_title for k in ["financial", "analysis", "data", "metrics", "market"]):
        if not re.search(r"\d", txt):
            fails.append("- No numeric data found, but expected.")
    if fails:
        feed = "Please fix:\n" + "\n".join(fails)
        print(f"[DEBUG] Section '{section.title}' failed evaluation: {feed}")
        return False, feed
    print(f"[DEBUG] Section '{section.title}' passed evaluation.")
    return True, ""

# =============================================================================
# SECTION-LEVEL SUBGRAPH
# =============================================================================

print("[DEBUG] Building section subgraph")
section_subgraph = StateGraph(SectionState)

# New version with concurrent execution:
section_subgraph.add_node("data_needs", node_section_data_needs)
section_subgraph.add_node("parallel_search", node_parallel_search)
section_subgraph.add_node("merge_data", node_merge_section_data)

# Update the edges:
section_subgraph.add_edge(START, "data_needs")
# After determining queries, launch all searches concurrently:
section_subgraph.add_edge("data_needs", "parallel_search")
# Merge the results after the concurrent searches complete:
section_subgraph.add_edge("parallel_search", "merge_data")
section_subgraph.add_edge("merge_data", END)

section_subgraph_compiled = section_subgraph.compile()
print("[DEBUG] Section subgraph compiled")

# =============================================================================
# MAIN REPORT GRAPH
# =============================================================================

print("[DEBUG] Building main report graph")
report_graph = StateGraph(state_schema=ReportState)

# Build main graph
report_graph.add_node("gen_outline", node_generate_outline)
report_graph.add_node("init_sections", lambda state: setattr(state, "current_section_idx", 0) or state)
report_graph.add_node("process_section", node_process_section)
report_graph.add_node("compile_final", node_compile_final)

report_graph.add_edge(START, "gen_outline")
report_graph.add_edge("gen_outline", "init_sections")
report_graph.add_edge("init_sections", "process_section")

def should_continue(state: ReportState):
    print(f"[DEBUG] Checking continuation: current index {state.current_section_idx} vs total sections {len(state.outline)}")
    if state.current_section_idx < len(state.outline):
        return "process_section"
    return "compile_final"

report_graph.add_conditional_edges(
    "process_section",
    should_continue
)

report_graph.add_edge("compile_final", END)
report_graph_compiled = report_graph.compile()
print("[DEBUG] Report graph compiled")

# ------------------------------------------------------------------------
# Function call
# ------------------------------------------------------------------------
def validate_report_state(state: Union[ReportState, dict]):
    required = ['final_report', 'outline']
    if isinstance(state, dict):
        for field in required:
            if field not in state:
                raise ValueError(f"Missing required field in state: {field}")
    else:
        for field in required:
            if not hasattr(state, field):
                raise ValueError(f"Missing required attribute in state: {field}")

def deduplicate_citations(citations: List[Citation]) -> List[Citation]:
    """
    Remove duplicate citations by type:
      - KB citations: unique by (file_name, page)
      - Web citations: unique by (title, url)
      - Excel citations: unique by (file_name, sheet, row, col)
    Citations that do not match these types are kept as-is if not already added.
    """
    unique_kb = {}
    unique_web = {}
    unique_excel = {}
    unique_others = []

    for citation in citations:
        if isinstance(citation, KBCitation):
            # Create key using file_name and page (page can be None)
            key = (citation.file_name, citation.page)
            if key not in unique_kb:
                unique_kb[key] = citation
        elif isinstance(citation, ExcelCitation):
            # Use file_name, sheet, row, and col as the unique key
            key = (citation.file_name, citation.sheet, citation.row, citation.col)
            if key not in unique_excel:
                unique_excel[key] = citation
        elif isinstance(citation, WebCitation):
            # Use title and url as the unique key
            key = (citation.title, citation.url)
            if key not in unique_web:
                unique_web[key] = citation
        else:
            # For any other citation types, you can use their id() or any comparable attribute.
            # This just adds them if they haven't been added yet.
            if citation not in unique_others:
                unique_others.append(citation)

    # Combine all unique citations in a single list
    deduped_list = list(unique_kb.values()) + list(unique_excel.values()) + list(unique_web.values()) + unique_others
    return deduped_list

def citation_to_dict(citation):
    if isinstance(citation, KBCitation):
        return {
            "type": "kb",
            "chunk_text": citation.chunk_text,
            "page": citation.page,
            "file_name": citation.file_name,
            "url": citation.url,
        }
    elif isinstance(citation, WebCitation):
        return {
            "type": "web",
            "title": citation.title,
            "url": citation.url,
            "snippet": citation.snippet,
        }
    elif isinstance(citation, ExcelCitation):
        return {
            "type": "excel",
            "file_name": citation.file_name,
            "sheet": citation.sheet,
            "row": citation.row,
            "col": citation.col,
            "value": citation.value,
        }
    else:
        # Fallback for other types
        return citation.__dict__

async def deep_research(instruction: str, report_type: int, 
                       file_search: bool, web_search: bool,
                       project_id: str, user_id: str):
    """Execute full research workflow with error handling"""
    print("[DEBUG] ===========================================================================================================================================================================")
    print("[DEBUG] ===================================================================== Starting deep_research workflow =====================================================================")
    print("[DEBUG] ===========================================================================================================================================================================")
    try:
        excel_search = has_excel_files(user_id, project_id)
        input_data = {
            "topic": instruction,
            "user_id": user_id,
            "report_type": int(report_type),
            "file_search": file_search,
            "web_research": web_search,
            "project_id": project_id,
            "config": ReportConfig(
                use_perplexity=True,
                perplexity_api_key=os.getenv("PERPLEXITY_API_KEY"),
                section_iterations=2,
                web_research=web_search,
                file_search=file_search,
                excel_search=excel_search
            )
        }
        print(f"[DEBUG] Value of excel_search {excel_search}, Value of kb_search {file_search}, Value of web_research {web_search}")
        # Run the graph
        graph_result = await report_graph_compiled.ainvoke(input_data)
        validate_report_state(graph_result)
        # Convert the result to a proper ReportState if needed
        if not isinstance(graph_result, ReportState):
            report_state = ReportState(
                topic=graph_result.get("topic", ""),
                user_id=graph_result.get("user_id", ""),
                project_id=graph_result.get("project_id", ""),
                report_type=graph_result.get("report_type", 0),
                file_search=graph_result.get("file_search", False),
                web_research=graph_result.get("web_research", False),
                final_report=graph_result.get("final_report"),
                outline=graph_result.get("outline", []),
                current_section_idx=graph_result.get("current_section_idx", 0)
            )
        else:
            report_state = graph_result
        print("[DEBUG] ==========================================================================================================================================================================")
        print("[DEBUG] ===================================================================== Exiting deep_research workflow =====================================================================")
        print("[DEBUG] ==========================================================================================================================================================================")
        deduped_list = deduplicate_citations(CITATIONS)
        report_sections = [citation_to_dict(c) for c in deduped_list]
        return {
            "status": "success",
            "report": report_state.final_report,
            "sections": report_sections
        }

    except Exception as e:
        print(f"[DEBUG] Research failed: {str(e)}")
        return {
            "status": "error",
            "message": f"Research failed: {str(e)}",
            "report": "",
            "sections": []
        }
