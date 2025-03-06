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
from fastapi import APIRouter, Body, HTTPException

from langchain_core.runnables import RunnableConfig
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.runnables import RunnableConfig

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
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt, Command

# Create a FastAPI router.
human_router = APIRouter()
checkpointer = MemorySaver()

# --------------------------- Helper ---------------------------
def cite() -> str:
    """
    Returns a string with the line number of the caller.
    (This is our “citation” mechanism.)
    """
    return f"[CITATION: line {inspect.currentframe().f_back.f_lineno}]"


# ------------------------ Configuration ------------------------
DEFAULT_REPORT_STRUCTURE = """You are an expert industry analyst. Generate a JSON object representing an industry report template that follows the structure below. Do not fill in any sample or dummy values—only output the keys with empty strings, zeros, or empty arrays/objects as appropriate to indicate their data types.

The JSON should have the following structure:

{
  "report_title": "",
  "report_date": "",
  "key_statistics": {
    "revenue": {
      "revenue_dollars": 0,
      "revenue_cagr_historical": {
        "begin_year": 0,
        "end_year": 0,
        "revenue_cagr_value": 0
      },
      "revenue_cagr_projected": {
        "begin_year": 0,
        "end_year": 0,
        "revenue_cagr_value": 0
      }
    },
    "profit": {
      "profit_dollars": 0,
      "profit_cagr_historical": {
        "begin_year": 0,
        "end_year": 0,
        "profit_cagr_value": 0
      },
      "profit_cagr_projected": {
        "begin_year": 0,
        "end_year": 0,
        "profit_cagr_value": 0
      }
    },
    "profit_margins": {
      "profit_margins_percentage": 0,
      "profit_margins_cagr_historical": {
        "begin_year": 0,
        "end_year": 0,
        "profit_margins_cagr_value": 0
      },
      "profit_margins_cagr_projected": {
        "begin_year": 0,
        "end_year": 0,
        "profit_margins_cagr_value": 0
      }
    },
    "industry_value_added": {
      "industry_value_added_dollars": 0,
      "industry_value_added_cagr_historical": {
        "begin_year": 0,
        "end_year": 0,
        "industry_value_added_cagr_value": 0
      },
      "industry_value_added_cagr_projected": {
        "begin_year": 0,
        "end_year": 0,
        "industry_value_added_cagr_value": 0
      }
    },
    "employees": {
      "employees_count": 0,
      "employees_cagr_historical": {
        "begin_year": 0,
        "end_year": 0,
        "employees_cagr_value": 0
      },
      "employees_cagr_projected": {
        "begin_year": 0,
        "end_year": 0,
        "employees_cagr_value": 0
      }
    },
    "wages": {
      "wages_dollars": 0,
      "wages_cagr_historical": {
        "begin_year": 0,
        "end_year": 0,
        "wages_cagr_value": 0
      },
      "wages_cagr_projected": {
        "begin_year": 0,
        "end_year": 0,
        "wages_cagr_value": 0
      }
    },
    "imports": {
      "imports_dollars": 0,
      "imports_cagr_historical": {
        "begin_year": 0,
        "end_year": 0,
        "imports_cagr_value": 0
      },
      "imports_cagr_projected": {
        "begin_year": 0,
        "end_year": 0,
        "imports_cagr_value": 0
      }
    },
    "exports": {
      "exports_dollars": 0,
      "exports_cagr_historical": {
        "begin_year": 0,
        "end_year": 0,
        "exports_cagr_value": 0
      },
      "exports_cagr_projected": {
        "begin_year": 0,
        "end_year": 0,
        "exports_cagr_value": 0
      }
    }
  },
  "executive_summary": "",
  "current_performance": [
    {
      "current_performance_point_title": "",
      "current_performance_point_description": ""
    }
  ],
  "future_outlook": [
    {
      "future_outlook_point_title": "",
      "future_outlook_point_description": ""
    }
  ],
  "industry_definition": "",
  "industry_impact": {
    "positive_impact_factors": [],
    "negative_impact_factors": [],
    "mixed_impact_factors": []
  },
  "swot_analysis": {
    "strengths": [],
    "weaknesses": [],
    "opportunities": [],
    "threats": []
  },
  "key_trends": [],
  "market_segmentation": [
    {
      "segment": "",
      "segment_description": "",
      "segment_percentage": 0
    }
  ],
  "products_and_services": [
    {
      "product_or_service": "",
      "product_description": "",
      "product_percentage": 0
    }
  ],
  "supply_chain": {
    "tier_1_suppliers": [],
    "tier_2_suppliers": [],
    "tier_1_buyers": [],
    "tier_2_buyers": []
  },
  "demand_determinants": [
    {
      "determinant_title": "",
      "determinant_description": ""
    }
  ],
  "international_trade": {
    "import_level": "",
    "import_trend": "",
    "export_level": "",
    "export_trend": "",
    "international_trade_points": [
      {
        "trade_title": "",
        "trade_description": ""
      }
    ]
  },
  "business_locations": [
    {
      "location": "",
      "location_description": "",
      "percentage_establishments": 0,
      "percentage_population": 0
    }
  ],
  "regulations_and_policies": {
    "regulations_level": "",
    "regulations_points": [
      {
        "regulation_title": "",
        "regulation_description": ""
      }
    ],
    "regulations_trend": ""
  },
  "barriers_to_entry": {
    "barriers_level": "",
    "barriers_trend": "",
    "barriers_points": [
      {
        "barrier_title": "",
        "barrier_description": ""
      }
    ],
    "factors_increased_barrier": [],
    "factors_decreased_barrier": []
  },
  "basis_of_competition": {
    "basis_level": "",
    "basis_trend": "",
    "basis_points": [
      {
        "basis_title": "",
        "basis_description": ""
      }
    ]
  },
  "market_share_concentration": {
    "concentration_level": "",
    "concentration_trend": "",
    "concentration_points": [
      {
        "concentration_title": "",
        "concentration_description": ""
      }
    ],
    "top_companies": [
      {
        "company_name": "",
        "company_percentage": 0
      }
    ]
  },
  "cost_structure_breakdown": [
    {
      "cost_type": "",
      "cost_type_percentage": 0
    }
  ],
  "cost_factors": [
    {
      "cost_factor_title": "",
      "cost_factor_description": ""
    }
  ],
  "capital_intensity": {
    "capital_intensity_level": "",
    "capital_intensity_points": [],
    "capital_intensity_trend": ""
  },
  "revenue_volatility": {
    "volatility_level": "",
    "volatility_points": [],
    "volatility_trend": ""
  },
  "technological_change": {
    "technological_change_level": "",
    "technological_change_points": [],
    "technological_change_trend": ""
  },
  "FAQs": [
    {
      "question": "",
      "answer": ""
    }
  ]
}

Remember: Do not include any example data or sample values—only output the keys with empty placeholders or zeros where a number is expected.

---
**Note**: This structure is flexible enough to be adapted for topics outside financial due diligence, focusing on organizing key findings, risks, and actionable recommendations in any complex analysis.
"""


@dataclass(kw_only=True)
class Configuration:
    """The configurable fields for the chatbot."""
    report_structure: str = DEFAULT_REPORT_STRUCTURE
    number_of_queries: int = 2
    tavily_topic: str = "general"
    tavily_days: str = None

    @classmethod
    def from_runnable_config(
        cls, config: Optional[RunnableConfig] = None
    ) -> "Configuration":
        """Create a Configuration instance from a RunnableConfig."""
        configurable = (
            config["configurable"] if config and "configurable" in config else {}
        )
        values: dict[str, Any] = {
            f.name: os.environ.get(f.name.upper(), configurable.get(f.name))
            for f in fields(cls)
            if f.init
        }
        return cls(**{k: v for k, v in values.items() if v})

# ------------------------------------------------------------------------
# PROMPTS
# ------------------------------------------------------------------------
report_planner_query_writer_instructions = """You are an expert financial and industry analyst. Your task is to propose specific search queries that will extract the necessary data to populate an industry report with the following information:

- **Report Title and Report Date** 
- **Key Statistics** (Revenue, Profit, Profit Margins, Industry Value Added, Employees, Wages, Imports, Exports, with historical & projected CAGR)
- **Executive Summary**
- **Current Performance**
- **Future Outlook**
- **Industry Definition**
- **Industry Impact**
- **SWOT Analysis**
- **Key Trends**
- **Market Segmentation**
- **Products and Services**
- **Supply Chain**
- **Demand Determinants**
- **International Trade**
- **Business Locations**
- **Regulations and Policies**
- **Barriers to Entry**
- **Basis of Competition**
- **Market Share Concentration**
- **Cost Structure Breakdown**
- **Cost Factors**
- **Capital Intensity**
- **Revenue Volatility**
- **Technological Change**
- **FAQs**

For each of these areas, propose targeted search queries that will help retrieve the relevant information from the documents. Limit the final total number of queries to around 10 or fewer if possible.

Query Context: {topic}
"""

report_planner_instructions = """You are an expert financial and industry analyst. Based on the topic and the combined relevant content from the local documents, produce a structured outline for an industry report. The outline should mirror the following sections that correspond to the JSON keys:

1. Report Title and Report Date
2. Key Statistics
3. Executive Summary
4. Current Performance
5. Future Outlook
6. Industry Definition
7. Industry Impact
8. SWOT Analysis
9. Key Trends
10. Market Segmentation
11. Products and Services
12. Supply Chain
13. Demand Determinants
14. International Trade
15. Business Locations
16. Regulations and Policies
17. Barriers to Entry
18. Basis of Competition
19. Market Share Concentration
20. Cost Structure Breakdown
21. Cost Factors
22. Capital Intensity
23. Revenue Volatility
24. Technological Change
25. FAQs

For each section, include sub-questions or data points that need to be answered. Use the extracted document context to inform your outline.

Topic: {topic}
Document Context: {context}
"""

section_writer_instructions = """You are an expert financial and industry analyst. Draft the content for the following section of an industry report based on the relevant document excerpts provided. Your content should directly address the data or questions implied by the corresponding JSON key (e.g., if the section is "Key Statistics – Revenue," discuss revenue figures, CAGR, etc.).

Section Title: {section_title}
Section Description: {section_topic}
Relevant Document Excerpts:
{context}

Please produce clear, precise, and professionally formatted content that could be directly inserted into the final report JSON.
"""

final_section_writer_instructions = """You are an expert financial and industry analyst. Compile the final sections of the industry report by synthesizing and polishing the content from all completed sections. Ensure that the final output is cohesive, professional, and accurately fills each part of the report as defined by the JSON template.

Context from Completed Sections:
{context}

Generate the final, integrated content for the industry report that aligns with the structure defined in the JSON template.
"""

reflection_instructions = """You are an expert quality-control assistant, reviewing the final report for completeness and accuracy. 
1. Identify any major gaps, missing data, or contradictions in the report. 
2. If any improvements are needed, answer 'YES' to reflection_needed; otherwise, answer 'NO'.

Final Report:
{final_report}
"""

reflection_json = """
Please respond in JSON with the format:
{
  "reflection_needed": true or false,
  "reflection_comments": "Your analysis or suggestions."
}
"""


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

OPENAI_API_KEY = "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"
openai.api_key = OPENAI_API_KEY


# ------------------------------------------------------------------------
# NEW: Index Creation or Loading for Multiple Documents with Random Persist Folder
# ------------------------------------------------------------------------
async def build_or_load_index_random(
    directory_paths: Any,  # Accepts a single path (str) or a list of paths
    base_storage_dir: str = BASE_STORAGE_DIR,
    rebuild: bool = False
) -> VectorStoreIndex:
    """
    Build or load a VectorStoreIndex from documents found in `directory_paths`.
    Instead of using a fixed persist folder, this function creates a new folder
    with a random UUID inside `base_storage_dir`. If the folder is empty or if
    rebuild=True, it rebuilds the index and persists it to that folder.

    Supports a single document (str) or multiple documents (list of str).
    """
    print(f"[DEBUG] Entering build_or_load_index_random {cite()}")
    if isinstance(directory_paths, str):
        directory_paths = [directory_paths]

    # Generate a random folder name under the base storage directory
    random_folder = os.path.join(base_storage_dir, str(uuid.uuid4()))
    os.makedirs(random_folder, exist_ok=True)
    print(f"[INFO] Using persist directory: {random_folder} {cite()}")

    # Check if folder is empty; if so, force rebuild
    if not os.listdir(random_folder):
        print(f"[INFO] Folder {random_folder} is empty. Forcing index rebuild. {cite()}")
        rebuild = True
    else:
        print(f"[DEBUG] Folder {random_folder} contents: {os.listdir(random_folder)} {cite()}")

    # Try to load the index from storage if not forcing rebuild
    if not rebuild:
        try:
            print(f"[INFO] Attempting to load existing index from storage. {cite()}")
            storage_context = StorageContext.from_defaults(persist_dir=random_folder)
            index = load_index_from_storage(storage_context)
            print(f"[INFO] Loaded existing index successfully. {cite()}")
            return index
        except Exception as e:
            print(f"[ERROR] Error loading existing index: {e}. Proceeding to rebuild the index. {cite()}")

    # Rebuild the index from the documents
    print(f"[INFO] Building a new index from documents... {cite()}")
    try:
        parser = LlamaParse(
            api_key="llx-Erd0RHKTagtHmXwstTZu9xwEK79mvxIC33Q5LkcHad492MBV",
            result_type="markdown"
        )
        all_documents = []
        for path in directory_paths:
            print(f"[DEBUG] Starting document parsing from: {path} {cite()}")
            docs = await parser.aload_data(path)
            print(f"[INFO] Parsed {len(docs)} documents from {path} successfully. {cite()}")

            all_documents.extend(docs)

    except Exception as e:
        print(f"[ERROR] Error parsing documents from {directory_paths}: {e} {cite()}")
        raise

    try:
        embedding_model = OpenAIEmbedding(model="text-embedding-ada-002")
        print(f"[DEBUG] Creating VectorStoreIndex from parsed documents using the embedding model. {cite()}")
        index = VectorStoreIndex.from_documents(all_documents, embedding=embedding_model)
        index.storage_context.persist(persist_dir=random_folder)
        print(f"[INFO] Index built and persisted to {random_folder}. {cite()}")
    except Exception as e:
        print(f"[ERROR] Error building or persisting the index: {e} {cite()}")
        raise

    print(f"[DEBUG] Exiting build_or_load_index_random {cite()}")
    return index


# ------------------------------------------------------------------------
# SCHEMAS
# ------------------------------------------------------------------------
class Section(BaseModel):
    name: str = Field(description="Name for this section of the report.")
    description: str = Field(description="Brief overview of the main topics.")
    research: bool = Field(description="Whether we need to query local docs.")
    content: str = Field(description="The content of this section.", default="")


class Sections(BaseModel):
    sections: List[Section] = Field(description="List of sections for the report.")


class SearchQuery(BaseModel):
    search_query: str = Field(..., description="A doc query relevant for the section.")


class Queries(BaseModel):
    queries: List[SearchQuery] = Field(description="List of doc queries.")


class ReportStateInput(TypedDict):
    topic: str  # e.g. "Financial due diligence for Company X"


class ReportStateOutput(TypedDict):
    final_report: str


class ReportState(TypedDict, total=False):
    topic: str
    sections: List[Section]
    completed_sections: Annotated[List[Section], operator.add]
    report_sections_from_research: str
    final_report: str
    reflection_count: int
    reflection_needed: bool


class SectionState(TypedDict):
    section: Section
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
Section {idx}: {sec.name} {cite()}
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
    1) Generate an initial set of queries to gather relevant data about the topic from local docs
    2) Retrieve doc context
    3) Generate an outline (sections) for the due diligence report.
    """
    topic = state["topic"]

    # Step 1: Generate queries (structured response)
    structured_llm_queries = gpt_4.with_structured_output(Queries)
    system_prompt_for_queries = report_planner_query_writer_instructions.format(topic=topic)

    queries_obj = structured_llm_queries.invoke([
        SystemMessage(content=system_prompt_for_queries),
        HumanMessage(content="Generate a list of doc queries in JSON under 'queries'.")
    ])
    print(f"[DEBUG] Generated queries {cite()}")

    # Step 2: Query the local documents
    doc_context_list = []
    if query_engine:
        for q in queries_obj.queries:
            resp = query_engine.query(q.search_query)

            doc_context_list.append(f"Query: {q.search_query}\n{str(resp)}\n")
    combined_context = "\n".join(doc_context_list)

    # Step 3: Create sections from that context
    structured_llm_sections = gpt_4.with_structured_output(Sections, method="function_calling")
    system_prompt_for_sections = report_planner_instructions.format(
        topic=topic,
        context=combined_context
    )

    sections_obj = structured_llm_sections.invoke([
        SystemMessage(content=system_prompt_for_sections),
        HumanMessage(content="Generate the JSON array of sections under 'sections'.")
    ])
    print(f"[DEBUG] Generated report sections {cite()}")

    return {"sections": sections_obj.sections}

def review_generate_report_plan(state: ReportState):
    print("[DEBUG] Entering human_node_1 with state:", state)
    revised_text = interrupt({
        "prompt": "Please revise the text below (Node 1):",
        "original_text": state.get("review_generate_report_plan", "No text provided")
    })
    print("[DEBUG] human_node_1 received resume value:", revised_text)
    # If the revised text is the same as before, force an update.
    if revised_text == state.get("review_generate_report_plan", ""):
        revised_text += " [updated node1]"
    new_state = {"review_generate_report_plan": revised_text}
    print("[DEBUG] human_node_1 returning new state:", new_state)
    return new_state

def generate_queries(state: SectionState, config: RunnableConfig):
    """
    For each section, we can optionally generate more specialized queries
    focusing exactly on that section.
    """
    section = state["section"]
    structured_llm_queries = gpt_4.with_structured_output(Queries)

    prompt = f"""You are an expert financial analyst. Generate up to 5 queries to find 
            more data for the following section:

            Section Description: {section.description}

            Focus on:
            - Key financial details
            - Possible issues or red flags
            - Specific metrics or policies
            - Historical and forward-looking info
            """

    queries_obj = structured_llm_queries.invoke([
        SystemMessage(content=prompt),
        HumanMessage(content="Return 'queries' in JSON.")
    ])
    print(f"[DEBUG] Generated specialized queries for section '{section.name}' {cite()}")
    return {"search_queries": queries_obj.queries}

def review_generate_queries(state: SectionState):
    print("[DEBUG] Entering review_generate_queries with state:", state)
    revised_query_str = interrupt({
        "prompt": "Ask more questions on this topic if you want. Separate each question with a ';'",
        "original_queries": state.get("search_queries", [])
    })
    print("[DEBUG] review_generate_queries received resume value:", revised_query_str)
    
    # Split the string on semicolons and remove any extra whitespace.
    query_strs = [q.strip() for q in revised_query_str.split(";") if q.strip()]
    
    # Convert each string into a SearchQuery object.
    new_queries = [SearchQuery(search_query=q) for q in query_strs]
    
    # Optionally, if you want to combine with the original queries:
    original_queries = state.get("search_queries", [])
    combined_queries = original_queries + new_queries
    
    print("[DEBUG] Combined queries:", combined_queries)
    return {"search_queries": combined_queries}

async def search_document(state: SectionState, config: RunnableConfig):
    """
    Use the queries from 'generate_queries' to retrieve doc excerpts from LlamaIndex.
    Combine them into a single 'source_str' used for drafting the section.
    """
    search_queries = state["search_queries"]
    results = []

    if query_engine is not None:
        for sq in search_queries:
            resp = query_engine.query(sq.search_query)

            results.append(f"Query: {sq.search_query}\n{str(resp)}\n")
    else:
        results.append("No query_engine available to retrieve info.")
    combined = "\n".join(results)
    print(f"[DEBUG] Combined document excerpts for section '{state['section'].name}' {cite()} {results}")
    return {"source_str": combined}

def write_section(state: SectionState):
    """
    Build the final text for this section from the combined source_str.
    """
    section = state["section"]
    src = state["source_str"]

    prompt = section_writer_instructions.format(
        section_title=section.name,
        section_topic=section.description,
        context=src
    )

    response = gpt_4.invoke([
        SystemMessage(content=prompt),
        HumanMessage(content="Draft the content for this section.")
    ])
    # Append a citation to the generated content.
    section.content = response.content + f"\n\n{cite()}"
    print(f"[DEBUG] Wrote section '{section.name}' {cite()}")
    return {"completed_sections": [section]}

def gather_completed_sections(state: ReportState):
    """
    After all the doc-research sections are done, gather them into a single
    reference string for final sections or final compilation.
    """
    completed_sections = state["completed_sections"]
    joined = format_sections(completed_sections)
    print(f"[DEBUG] Gathered completed sections {cite()}")
    return {"report_sections_from_research": joined}

def write_final_sections(state: SectionState):
    """
    For sections that do not require additional doc-based research,
    we can finalize them by leveraging any context from 'report_sections_from_research'.
    """
    section = state["section"]
    all_research = state["report_sections_from_research"]

    prompt = final_section_writer_instructions.format(context=all_research)
    response = gpt_4.invoke([
        SystemMessage(content=f"Generate the final text for {section.name}: {section.description}"),
        HumanMessage(content=prompt)
    ])
    section.content = response.content + f"\n\n{cite()}"
    print(f"[DEBUG] Finalized section '{section.name}' without additional doc research {cite()}")
    return {"completed_sections": [section]}

def compile_final_report(state: ReportState):
    """
    Combine all sections into a single text block for the final output.
    """
    sections = state["sections"]
    # Map from name -> content of completed sections
    completed_map = {s.name: s.content for s in state["completed_sections"]}

    # Reattach content in the original order
    for s in sections:
        if s.name in completed_map:
            s.content = completed_map[s.name]

    final_report_text = "\n\n".join([sec.content for sec in sections])
    print(f"[DEBUG] Compiled final report {cite()}")
    return {"final_report": final_report_text}

def reflect_on_report(state: ReportState, config: RunnableConfig):
    """
    After compiling the final report, ask the LLM to reflect on whether it
    can be improved. If reflection is needed, we'll loop back for another pass.
    """
    final_report = state["final_report"]
    reflection_count = state.get("reflection_count", 0)

    reflection_prompt = reflection_instructions.format(final_report=final_report) + reflection_json
    reflection_response = gpt_4.invoke([
        SystemMessage(content=reflection_prompt),
        HumanMessage(content="Please provide reflection in the specified JSON format.")
    ]).content.strip()

    try:
        reflection_data = json.loads(reflection_response)
        reflection_needed = reflection_data.get("reflection_needed", False)
    except:
        reflection_needed = False
        reflection_data = {"reflection_comments": "Could not parse reflection. Defaulting to no improvement needed."}

    reflection_count += 1
    print(f"[DEBUG] Reflection results: {reflection_data} {cite()}")
    print(f"[DEBUG] reflection_count={reflection_count}, reflection_needed={reflection_needed} {cite()}")

    return {
        "reflection_needed": reflection_needed,
        "reflection_count": reflection_count,
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

# 1) Generate overall plan
builder.add_node("generate_report_plan", generate_report_plan)

# 2) Build a subgraph for a single section that needs doc research
section_builder = StateGraph(SectionState, output=SectionOutputState)
section_builder.add_node("generate_queries", generate_queries)
section_builder.add_node("review_generate_queries", review_generate_queries)
section_builder.add_node("search_document", search_document)
section_builder.add_node("write_section", write_section)
section_builder.add_edge(START, "generate_queries")
section_builder.add_edge("generate_queries", "review_generate_queries")
section_builder.add_edge("review_generate_queries", "search_document")
section_builder.add_edge("search_document", "write_section")
section_builder.add_edge("write_section", END)

builder.add_node("build_section_with_doc_research", section_builder.compile())

# 3) Node to gather completed sections
builder.add_node("gather_completed_sections", gather_completed_sections)

# 4) Node to finalize sections that do NOT require doc search
builder.add_node("write_final_sections", write_final_sections)

# 5) Node to compile final result
builder.add_node("compile_final_report", compile_final_report)

# 6) Node to reflect on final report
builder.add_node("reflect_on_report", reflect_on_report)

# Edges:
builder.add_edge(START, "generate_report_plan")


# After generating the overall plan, conditionally route sections that require doc research
def initiate_section_writing(state: ReportState):
    return [
        Send("build_section_with_doc_research", {"section": s})
        for s in state["sections"]
        if s.research
    ]

builder.add_conditional_edges("generate_report_plan", initiate_section_writing, ["build_section_with_doc_research"])

# Then gather all doc-researched sections
builder.add_edge("build_section_with_doc_research", "gather_completed_sections")

# After that, we finalize sections that do NOT require doc research
def initiate_final_section_writing(state: ReportState):
    return [
        Send("write_final_sections", {
            "section": s,
            "report_sections_from_research": state["report_sections_from_research"]
        })
        for s in state["sections"]
        if not s.research
    ]

builder.add_conditional_edges("gather_completed_sections", initiate_final_section_writing, ["write_final_sections"])

# Then compile the final report
builder.add_edge("write_final_sections", "compile_final_report")

# After compiling final report, reflect on it
builder.add_edge("compile_final_report", "reflect_on_report")

# Now we conditionally decide if we need another pass. 
def reflection_reroute(state: ReportState):
    if state["reflection_needed"] and state["reflection_count"] < 3:
        # We do a new pass. Typically you might refine queries or re-run.
        # For simplicity, let's just re-run from "gather_completed_sections".
        return [Send("gather_completed_sections", {})]
    else:
        return []

builder.add_conditional_edges("reflect_on_report", reflection_reroute, ["gather_completed_sections"])
builder.add_edge("reflect_on_report", END)

workflow = builder.compile(checkpointer=checkpointer)

class ResumeRequest(BaseModel):
    thread_id: str
    revised_text: str

@human_router.post("/api/start-graph")
async def start_graph(topic: str = Body(..., media_type="text/plain")):
    # Example file paths – you can pass more than one document.
    file_paths = [
        "C:/Users/Rushil Shrivastava/Downloads/Dollar Cave Club Model MASTER 2022.xlsx"
    ]
    
    # Step 1: Build or load index from your local data:
    index = await build_or_load_index_random(directory_paths=file_paths, rebuild=True)
    
    # Step 2: Make a query engine from the index:
    engine = index.as_query_engine(similarity_top_k=10)
    
    # Step 3: Set the global reference.
    set_query_engine(engine)

    print("[DEBUG] start_graph endpoint called.")
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    initial_input = {"topic": topic}
    print("[DEBUG] start_graph: initial_input:", initial_input)
    
    # Use the asynchronous invocation and await it.
    await workflow.ainvoke(initial_input, config=config)
    print("[DEBUG] start_graph: workflow.ainvoke completed.")
    
    # Get the current state to retrieve the interrupt details.
    state_snapshot = workflow.get_state(config)
    print("[DEBUG] start_graph: Retrieved state:", state_snapshot)
    if not state_snapshot.tasks:
        # If there are no pending tasks, then the workflow is complete.
        return {"status": "completed", "result": state_snapshot.values}
    
    # Extract the interrupt information from the first pending task.
    interrupt_value = state_snapshot.tasks[0].interrupts[0].value
    print("[DEBUG] start_graph: interrupt_value:", interrupt_value)
    return {
        "status": "paused",
        "thread_id": thread_id,
        "interrupt": interrupt_value
    }


@human_router.post("/api/resume-graph")
async def resume_graph(request: ResumeRequest):
    print("[DEBUG] resume_graph endpoint called with request:", request)
    config = {"configurable": {"thread_id": request.thread_id}}
    
    try:
        # Resume the workflow with the provided human input using asynchronous invocation.
        await workflow.ainvoke(Command(resume=request.revised_text), config=config)
        print("[DEBUG] resume_graph: workflow.ainvoke resume completed.")
        
        # Retrieve the updated state.
        state_snapshot = workflow.get_state(config)
        print("[DEBUG] resume_graph: Retrieved state:", state_snapshot)
        if state_snapshot.tasks:
            # If there is another pending interrupt, return its details.
            interrupt_value = state_snapshot.tasks[0].interrupts[0].value
            print("[DEBUG] resume_graph: New interrupt found:", interrupt_value)
            return {
                "status": "paused",
                "thread_id": request.thread_id,
                "interrupt": interrupt_value
            }
        else:
            print("[DEBUG] resume_graph: No pending tasks, workflow complete.")
            return {"status": "completed", "result": state_snapshot.values}
    except Exception as e:
        print("[DEBUG] resume_graph: Exception occurred:", e)
        raise HTTPException(status_code=500, detail=str(e))
