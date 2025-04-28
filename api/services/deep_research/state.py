
from pydantic import BaseModel, Field
from dataclasses import dataclass, field
from typing import Dict, List, TypedDict, Any, Optional, Annotated, Union

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
