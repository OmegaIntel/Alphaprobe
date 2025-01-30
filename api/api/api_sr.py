import asyncio
from typing_extensions import TypedDict
from typing import List, Optional, Dict
from pydantic import BaseModel, Field

from tavily import TavilyClient, AsyncTavilyClient
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import START, END, StateGraph
from langsmith import traceable
import config.configuration as configuration
import os

# -----------------------------------------------------------------
# API Key setup
tavily_api_key = os.getenv("TAVILY_API_KEY", "default_key_if_missing")
openai_api_key = os.getenv("OPENAI_API_KEY", "default_key_if_missing")

print(f"DEBUG: Tavily API Key: {tavily_api_key}")
print(f"DEBUG: OpenAI API Key: {openai_api_key}")

# -----------------------------------------------------------------
# LLMs
gpt_4o = ChatOpenAI(model="gpt-4o", temperature=0, api_key=openai_api_key)
print("DEBUG: OpenAI Chat Model initialized successfully.")

# -----------------------------------------------------------------
# Search
tavily_client = TavilyClient(api_key=tavily_api_key)
tavily_async_client = AsyncTavilyClient(api_key=tavily_api_key)
print("DEBUG: Tavily clients initialized successfully.")

# -----------------------------------------------------------------
# Pydantic Models for Query & Output

class SearchQuery(BaseModel):
    search_query: str = Field(description="Query for web search.")

class Queries(BaseModel):
    queries: List[SearchQuery] = Field(description="List of search queries.")

# ------------------- 
# Nested Classes for the Large JSON

class CAGRData(BaseModel):
    begin_year: int
    end_year: int
    value: float

class Revenue(BaseModel):
    revenue_dollars: float
    revenue_cagr_historical: Optional[CAGRData]
    revenue_cagr_projected: Optional[CAGRData]

class Profit(BaseModel):
    profit_dollars: float
    profit_cagr_historical: Optional[CAGRData]
    profit_cagr_projected: Optional[CAGRData]

class ProfitMargins(BaseModel):
    profit_margins_percentage: float
    profit_margins_cagr_historical: Optional[CAGRData]
    profit_margins_cagr_projected: Optional[CAGRData]

class KeyStatistics(BaseModel):
    revenue: Revenue
    profit: Profit
    profit_margins: ProfitMargins

class CurrentPerformancePoint(BaseModel):
    current_performance_point_title: str
    current_performance_point_description: str

class FutureOutlookPoint(BaseModel):
    future_outlook_point_title: str
    future_outlook_point_description: str

class IndustryImpact(BaseModel):
    positive_impact_factors: List[str]
    negative_impact_factors: List[str]
    mixed_impact_factors: List[str]

class SWOTAnalysis(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]

class MarketSegmentation(BaseModel):
    segment: str
    segment_description: str
    segment_percentage: float

class ProductService(BaseModel):
    product_or_service: str
    product_description: str
    product_percentage: float

class SupplyChain(BaseModel):
    tier_1_suppliers: List[str]
    tier_2_suppliers: List[str]
    tier_1_buyers: List[str]
    tier_2_buyers: List[str]

class DemandDeterminant(BaseModel):
    determinant_title: str
    determinant_description: str

class InternationalTradePoint(BaseModel):
    trade_title: str
    trade_description: str

class InternationalTrade(BaseModel):
    import_level: str
    import_trend: str
    export_level: str
    export_trend: str
    international_trade_points: List[InternationalTradePoint]

class BusinessLocation(BaseModel):
    location: str
    location_description: str
    percentage_establishments: float
    percentage_population: float

class RegulationPoint(BaseModel):
    regulation_title: str
    regulation_description: str

class RegulationsAndPolicies(BaseModel):
    regulations_level: str
    regulations_points: List[RegulationPoint]
    regulations_trend: str

class BarrierPoint(BaseModel):
    barrier_title: str
    barrier_description: str

class BarriersToEntry(BaseModel):
    barriers_level: str
    barriers_trend: str
    barriers_points: List[BarrierPoint]
    factors_increased_barrier: List[str]
    factors_decreased_barrier: List[str]

class BasisPoint(BaseModel):
    basis_title: str
    basis_description: str

class BasisOfCompetition(BaseModel):
    basis_level: str
    basis_trend: str
    basis_points: List[BasisPoint]

class MarketShareConcentrationPoint(BaseModel):
    concentration_title: str
    concentration_description: str

class TopCompany(BaseModel):
    company_name: str
    company_percentage: float

class MarketShareConcentration(BaseModel):
    concentration_level: str
    concentration_trend: str
    concentration_points: List[MarketShareConcentrationPoint]
    top_companies: List[TopCompany]

class CostStructurePoint(BaseModel):
    cost_type: str
    cost_type_percentage: float

class CostFactorPoint(BaseModel):
    cost_factor_title: str
    cost_factor_description: str

class CapitalIntensity(BaseModel):
    capital_intensity_level: str
    capital_intensity_points: List[str]
    capital_intensity_trend: str

class RevenueVolatility(BaseModel):
    volatility_level: str
    volatility_points: List[str]
    volatility_trend: str

class TechnologicalChange(BaseModel):
    technological_change_level: str
    technological_change_points: List[str]
    technological_change_trend: str

class FAQPoint(BaseModel):
    question: str
    answer: str

# -------------------
# Complete Model
# NEW: added `sources_used` field at the bottom

class FinancialReport(BaseModel):
    report_title: str
    report_date: str
    key_statistics: KeyStatistics
    executive_summary: str
    current_performance: List[CurrentPerformancePoint]
    future_outlook: List[FutureOutlookPoint]
    industry_definition: str
    industry_impact: IndustryImpact
    swot_analysis: SWOTAnalysis
    key_trends: List[str]
    market_segmentation: List[MarketSegmentation]
    products_and_services: List[ProductService]
    supply_chain: SupplyChain
    demand_determinants: List[DemandDeterminant]
    international_trade: InternationalTrade
    business_locations: List[BusinessLocation]
    regulations_and_policies: RegulationsAndPolicies
    barriers_to_entry: BarriersToEntry
    basis_of_competition: BasisOfCompetition
    market_share_concentration: MarketShareConcentration
    cost_structure_breakdown: List[CostStructurePoint]
    cost_factors: List[CostFactorPoint]
    capital_intensity: CapitalIntensity
    revenue_volatility: RevenueVolatility
    technological_change: TechnologicalChange
    FAQs: List[FAQPoint]

    # This new field will hold the sources used in the final report.
    sources_used: List[str] = Field(default_factory=list)

    class Config:
        schema_extra = {
            "required": [
                "report_title",
                "report_date",
                "key_statistics",
                "executive_summary",
                "current_performance",
                "future_outlook",
                "industry_definition",
                "industry_impact",
                "swot_analysis",
                "key_trends",
                "market_segmentation",
                "products_and_services",
                "supply_chain",
                "demand_determinants",
                "international_trade",
                "business_locations",
                "regulations_and_policies",
                "barriers_to_entry",
                "basis_of_competition",
                "market_share_concentration",
                "cost_structure_breakdown",
                "cost_factors",
                "capital_intensity",
                "revenue_volatility",
                "technological_change",
                "FAQs",
                "sources_used"
            ]
        }

# ------------------------------------------------------------
# State Definitions

class FinancialReportInputState(TypedDict):
    topic: str

class FinancialReportOutputState(TypedDict):
    final_report: dict

class FinancialReportState(TypedDict):
    topic: str
    search_queries: List[SearchQuery]
    source_str: str
    final_report: dict

# ------------------------------------------------------------
# Utility Functions

@traceable
def tavily_search(query: str) -> dict:
    print(f"DEBUG: Performing Tavily search for query: {query}")
    return tavily_client.search(
        query,
        max_results=5,
        include_raw_content=True
    )

@traceable
async def tavily_search_async(search_queries: List[str], tavily_topic: str, tavily_days: int) -> List[dict]:
    print(f"DEBUG: Performing async Tavily search with queries: {search_queries}, topic: {tavily_topic}, days: {tavily_days}")
    search_tasks = []
    for query in search_queries:
        if tavily_topic == "news":
            search_tasks.append(
                tavily_async_client.search(
                    query,
                    max_results=5,
                    include_raw_content=True,
                    topic="news",
                    days=tavily_days
                )
            )
        else:
            search_tasks.append(
                tavily_async_client.search(
                    query,
                    max_results=5,
                    include_raw_content=True,
                    topic="general"
                )
            )
    search_docs = await asyncio.gather(*search_tasks)
    print(f"DEBUG: Async Tavily search completed. Number of responses: {len(search_docs)}")
    return search_docs

def deduplicate_and_format_sources(search_response, max_tokens_per_source=1000):
    """
    Returns a single text block, but we can also easily parse out separate URLs or snippets if desired.
    """
    if isinstance(search_response, dict):
        sources_list = search_response.get('results', [])
    elif isinstance(search_response, list):
        sources_list = []
        for resp in search_response:
            if isinstance(resp, dict) and 'results' in resp:
                sources_list.extend(resp['results'])
            else:
                sources_list.extend(resp)
    else:
        raise ValueError("Search response must be a dict or list of dicts.")

    unique_sources = {}

    for src in sources_list:
        url = src.get('url', '')
        if url and url not in unique_sources:
            unique_sources[url] = src

    formatted_text = "Consolidated Sources:\n\n"
    token_limit = max_tokens_per_source * 4  # approximate tokens for safety

    for i, source in enumerate(unique_sources.values(), 1):
        title = source.get("title", "No Title")
        url = source.get("url", "No URL")
        snippet = source.get("content", "")
        raw_content = source.get("raw_content") or ""

        if len(raw_content) > token_limit:
            raw_content = raw_content[:token_limit] + "...[truncated]"

        formatted_text += (
            f"Source {i}: {title}\n"
            f"URL: {url}\n"
            f"Snippet: {snippet}\n"
            f"Raw Content: {raw_content}\n\n"
        )

    return formatted_text.strip()

# ------------------------------------------------------------
# PROMPTS

financial_report_query_prompt = """You are a financial analyst tasked with researching the {topic} from a purely financial and industry data perspective.

Please produce exactly 3 highly specific web search queries that will help find recent (and authoritative) financial data, market statistics, CAGR info, revenue/profit insights, and any relevant details about this industry. 
We want to uncover:
1) Market size, growth, and trends
2) Key financial metrics (like revenue, margins, etc.)
3) SWOT or industry-level data

Output must be valid JSON with a 'queries' field, where each query is an object with a 'search_query' field.
"""

# Updated final schema to include "sources_used" at the very end
financial_report_full_schema = """{
    "report_title": "string",
    "report_date": "string",
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
    "executive_summary": "string",
    "current_performance": [
        {
            "current_performance_point_title": "string",
            "current_performance_point_description": "string"
        }
    ],
    "future_outlook": [
        {
            "future_outlook_point_title": "string",
            "future_outlook_point_description": "string"
        }
    ],
    "industry_definition": "string",
    "industry_impact": {
        "positive_impact_factors": [
            "string",
            "string"
        ],
        "negative_impact_factors": [
            "string",
            "string"
        ],
        "mixed_impact_factors": []
    },
    "swot_analysis": {
        "strengths": [
            "string",
            "string"
        ],
        "weaknesses": [
            "string"
        ],
        "opportunities": [
            "string"
        ],
        "threats": [
            "string"
        ]
    },
    "key_trends": [
        "string",
        "string",
        "string"
    ],
    "market_segmentation": [
        {
            "segment": "string",
            "segment_description": "string",
            "segment_percentage": 0
        }
    ],
    "products_and_services": [
        {
            "product_or_service": "string",
            "product_description": "string",
            "product_percentage": 0
        }
    ],
    "supply_chain": {
        "tier_1_suppliers": [
            "string"
        ],
        "tier_2_suppliers": [
            "string"
        ],
        "tier_1_buyers": [
            "string"
        ],
        "tier_2_buyers": [
            "string"
        ]
    },
    "demand_determinants": [
        {
            "determinant_title": "string",
            "determinant_description": "string"
        }
    ],
    "international_trade": {
        "import_level": "string",
        "import_trend": "string",
        "export_level": "string",
        "export_trend": "string",
        "international_trade_points": [
            {
                "trade_title": "string",
                "trade_description": "string"
            }
        ]
    },
    "business_locations": [
        {
            "location": "string",
            "location_description": "string",
            "percentage_establishments": 0,
            "percentage_population": 0
        }
    ],
    "regulations_and_policies": {
        "regulations_level": "string",
        "regulations_points": [
            {
                "regulation_title": "string",
                "regulation_description": "string"
            }
        ],
        "regulations_trend": "string"
    },
    "barriers_to_entry": {
        "barriers_level": "string",
        "barriers_trend": "string",
        "barriers_points": [
            {
                "barrier_title": "string",
                "barrier_description": "string"
            }
        ],
        "factors_increased_barrier": [
            "string"
        ],
        "factors_decreased_barrier": [
            "string"
        ]
    },
    "basis_of_competition": {
        "basis_level": "string",
        "basis_trend": "string",
        "basis_points": [
            {
                "basis_title": "string",
                "basis_description": "string"
            }
        ]
    },
    "market_share_concentration": {
        "concentration_level": "string",
        "concentration_trend": "string",
        "concentration_points": [
            {
                "concentration_title": "string",
                "concentration_description": "string"
            }
        ],
        "top_companies": [
            {
                "company_name": "string",
                "company_percentage": 0
            }
        ]
    },
    "cost_structure_breakdown": [
        {
            "cost_type": "string",
            "cost_type_percentage": 0
        }
    ],
    "cost_factors": [
        {
            "cost_factor_title": "string",
            "cost_factor_description": "string"
        }
    ],
    "capital_intensity": {
        "capital_intensity_level": "string",
        "capital_intensity_points": [],
        "capital_intensity_trend": "string"
    },
    "revenue_volatility": {
        "volatility_level": "string",
        "volatility_points": [],
        "volatility_trend": "string"
    },
    "technological_change": {
        "technological_change_level": "string",
        "technological_change_points": [],
        "technological_change_trend": "string"
    },
    "FAQs": [
        {
            "question": "string",
            "answer": "string"
        }
    ],
    "sources_used": [
        "string"
    ]
}
"""

financial_report_builder_prompt = """You are a financial analyst. 
Use the following gathered information from web sources to create a SINGLE JSON financial report.
Here are the sources:

{source_str}

Your final output must match this JSON structure **exactly** (no extra key but if while your analysis, if the value to any of the key mentioned in the json was missing then replace the value with "N/A". Don't let it be the same as in the json):

```json
{financial_report_schema}
"""

def generate_search_queries(state: FinancialReportState, config: RunnableConfig):
    print(f"DEBUG: Generating search queries for topic: {state['topic']}")
    topic = state["topic"]
    prompt = financial_report_query_prompt.format(topic=topic)
    structured_llm = gpt_4o.with_structured_output(Queries)
    result = structured_llm.invoke(
        [SystemMessage(content=prompt)] +
        [HumanMessage(content="Generate 3 queries in valid JSON.")]
    )
    return {"search_queries": result.queries}


async def gather_sources(state: FinancialReportState, config: RunnableConfig):
    print(f"DEBUG: Gathering sources for search queries: {state['search_queries']}")
    queries = state["search_queries"]
    query_list = [q.search_query for q in queries]

    cfg = configuration.Configuration.from_runnable_config(config)
    tavily_topic = cfg.tavily_topic
    tavily_days = cfg.tavily_days

    search_docs = await tavily_search_async(query_list, tavily_topic, tavily_days)
    source_str = deduplicate_and_format_sources(search_docs, max_tokens_per_source=500)
    return {"source_str": source_str}


def build_financial_report(state: FinancialReportState) -> dict:
    print(f"DEBUG: Building financial report for topic: {state['topic']}")
    topic = state["topic"]
    source_str = state["source_str"]

    prompt = financial_report_builder_prompt.format(
        source_str=source_str,
        financial_report_schema=financial_report_full_schema
    )

    structured_llm = gpt_4o.with_structured_output(FinancialReport)
    result = structured_llm.invoke(
        [SystemMessage(content=prompt)] +
        [HumanMessage(content=f"Topic: {topic}")]
    )

    # Insert the sources into the final JSON under the `sources_used` field
    report_dict = result.dict()
    report_dict["sources_used"] = [source_str]  # keep as a single string in a one-element list

    print("DEBUG: Financial report built successfully")
    return {"final_report": report_dict}


# ------------------------------------------------------------
# Build the Graph
builder = StateGraph(
    input=FinancialReportInputState,
    output=FinancialReportOutputState,
    config_schema=configuration.Configuration
)

builder.add_node("generate_search_queries", generate_search_queries)
builder.add_node("gather_sources", gather_sources)
builder.add_node("build_financial_report", build_financial_report)

builder.add_edge(START, "generate_search_queries")
builder.add_edge("generate_search_queries", "gather_sources")
builder.add_edge("gather_sources", "build_financial_report")
builder.add_edge("build_financial_report", END)

financial_report_graph = builder.compile()
