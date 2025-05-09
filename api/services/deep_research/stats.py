from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from enum import Enum

from pydantic import BaseModel, Field

# ------------------------------------------------------------------------
# DATA MODELS
# ------------------------------------------------------------------------


class Trend(Enum):
    up = "up"
    down = "down"
    stable = "stable"


class DataType(Enum):
    revenue = "revenue"
    profit = "profit"
    margin = "margin"
    growth_rate = "growth_rate"
    market_share = "market_share"
    valuation = "valuation"
    ratio = "ratio"
    other = "other"


class DataPoint(BaseModel):
    name: str = Field(..., description="Descriptive name of the metric")
    value: Optional[float] = Field(
        None, description="The numerical value or percentage"
    )
    unit: Optional[str] = Field(None, description="Unit of measurement (%, $, etc.)")
    time_period: Optional[str] = Field(
        None, description="Time period this applies to (e.g., '2023', 'Q1 2024')"
    )
    source: Optional[str] = Field(None, description="Source of the data point")
    significance: Optional[str] = Field(
        None, description="Why this data point matters to the analysis"
    )
    trend: Optional[Trend] = Field(
        None, description="Trend direction if available (up/down/stable)"
    )
    comparison: Optional[Dict[str, float]] = Field(
        None, description="Comparison data (e.g., industry avg, competitor metrics)"
    )
    data_type: Optional[DataType] = Field(None, description="Type of financial data")


class SectionContent(BaseModel):
    content: str = Field(..., description="Generated markdown content for this section")
    data_points: List[DataPoint] = Field(
        default_factory=list,
        description="Key numerical findings extracted from research",
    )
    key_takeaways: List[str] = Field(
        default_factory=list, description="3-5 main conclusions from this section"
    )
    further_research: bool = Field(
        default=False, description="Whether additional research is needed"
    )


# ------------------------------------------------------------------------
# CONFIG & STATE
# ------------------------------------------------------------------------


@dataclass
class ReportConfig:
    section_iterations: int = 2
    web_research: bool = True
    file_search: bool = True
    excel_search: bool = False
    use_perplexity: bool = True
    perplexity_api_key: Optional[str] = None
    use_tavily: bool = False
    use_serpapi: bool = False
    retain_temp_files: bool = False


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
    citations: List[Citation]
    context_text: str
    original_queries: List[str]


@dataclass
class SectionState:
    title: str
    description: str = ""
    report_state: Any = None
    web_research: bool = False
    excel_search: bool = False
    kb_search: bool = False
    report_type: int = 0

    # Results and context
    web_results: List[SearchResult] = field(default_factory=list)
    excel_results: List[SearchResult] = field(default_factory=list)
    kb_results: List[SearchResult] = field(default_factory=list)
    citations: List[Citation] = field(default_factory=list)
    context: List[str] = field(default_factory=list)

    # Generated content & state
    content: str = Field(default="")  # markdown content
    attempts: int = 0

    # Queries
    web_queries: List[str] = field(default_factory=list)
    excel_queries: List[str] = field(default_factory=list)
    kb_queries: List[str] = field(default_factory=list)


@dataclass
class ReportState:
    topic: str
    user_id: str
    project_id: str
    report_type: int
    file_search: bool
    web_research: bool
    update_query: Optional[str] = None
    update_section_index: Optional[int] = None
    update_queries: List[str] = field(default_factory=list)
    exists: bool = False
    config: ReportConfig = field(default_factory=ReportConfig)
    outline: List[SectionState] = field(default_factory=list)
    current_section_idx: int = 0
    final_report: str = ""

class SectionChooser(BaseModel):
    chosen_index: Optional[int] = Field(
        None, description="Index of the section that best matches `state.update_query`, or null."
    )

class UpdateQueries(BaseModel):
    queries: List[str] = Field(
        ..., description="Two follow-up queries to research the update."
    )

class UpdateParagraph(BaseModel):
    paragraph: str = Field(
        ..., description="The paragraph to be updated with new information."
    )
