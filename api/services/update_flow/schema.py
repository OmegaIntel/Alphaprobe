# models.py
from __future__ import annotations
from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field

class UpdateType(str, Enum):
    GENERAL_FORMATTING       = "GENERAL_FORMATTING"
    SECTION_ORDERING         = "SECTION_ORDERING"
    VISUAL_TYPE_CHANGE       = "VISUAL_TYPE_CHANGE"
    BULLET_STYLE_CHANGE      = "BULLET_STYLE_CHANGE"
    VISUAL_DATA_CORRECTION   = "VISUAL_DATA_CORRECTION"
    DATA_ENRICHMENT          = "DATA_ENRICHMENT"
    ADD_SECTION              = "ADD_SECTION"
    REMOVE_SECTION           = "REMOVE_SECTION"
    MERGE_SECTIONS           = "MERGE_SECTIONS"
    UPDATE_NUMERIC_VALUES    = "UPDATE_NUMERIC_VALUES"
    FIX_FACTUAL_ERROR        = "FIX_FACTUAL_ERROR"
    LANGUAGE_TONE_CHANGE     = "LANGUAGE_TONE_CHANGE"

class OutputStyle(str, Enum):
    PARAGRAPH      = "PARAGRAPH"        # default 1–2 paras (today’s behaviour)
    BULLETS        = "BULLETS"          # bullet list
    MARKDOWN_TABLE = "MARKDOWN_TABLE"   # <table> in MD
    CHART          = "CHART"            # we’ll pass this to a viz node, etc.

class UpdateFragment(BaseModel):
    update_type:     UpdateType
    target_sections: Optional[List[int]] = None
    target_visuals:  Optional[List[str]] = None
    note:            Optional[str]       = None
    need_research:   bool                = False
    research_topics: Optional[List[str]] = None
    output_style:    OutputStyle         = OutputStyle.PARAGRAPH   # NEW


class UpdateRequest(BaseModel):
    fragments: List[UpdateFragment]

@dataclass
class SearchResult:
    url: str
    snippet: str

@dataclass
class Citation:
    id: str
    url: str
    text: str

@dataclass
class SectionState:
    title:       str
    description: str = ""
    report_state: Any = None
    web_research: bool = False
    excel_search: bool = False
    kb_search:   bool = False
    report_type: int  = 0

    # evidence
    web_results:   List[SearchResult] = field(default_factory=list)
    excel_results: List[SearchResult] = field(default_factory=list)
    kb_results:    List[SearchResult] = field(default_factory=list)
    citations:     List[Citation]     = field(default_factory=list)
    context:       List[str]          = field(default_factory=list)

    # generated
    content:  str = Field(default="")
    attempts: int = 0

    # queries
    web_queries:   List[str] = field(default_factory=list)
    excel_queries: List[str] = field(default_factory=list)
    kb_queries:    List[str] = field(default_factory=list)

@dataclass
class ReportConfig:
    section_iterations: int = 2
    web_research:       bool = True
    file_search:        bool = True
    excel_search:       bool = False
    use_perplexity:     bool = True
    perplexity_api_key: Optional[str] = None
    use_tavily:         bool = False
    use_serpapi:        bool = False
    retain_temp_files:  bool = False

@dataclass
class ReportState:
    topic:                str
    user_id:              str
    project_id:           str
    report_type:          int
    file_search:          bool
    web_research:         bool
    update_query:         Optional[str] = None
    update_section_index: Optional[int] = None
    update_queries:       List[str] = field(default_factory=list)
    exists:               bool = False
    config:               ReportConfig = field(default_factory=ReportConfig)
    old_report:           str = ""
    outline:              List[SectionState] = field(default_factory=list)
    current_section_idx:  int = 0
    final_report:         str = ""

@dataclass
class UpdateGraphState:
    query:               str
    report:              ReportState
    update_req:          Optional[UpdateRequest]  = None
    need_research:       bool                     = False
    research_queries:    List[str]                = field(default_factory=list)
    new_data:            Optional[Dict[str, Any]] = None
    frag_idx:            int                      = 0  # for fragment-by-fragment loops
    need_visual_refresh: bool                     = False

class VisualPatch(BaseModel):
    spec: str    = Field(..., description="Full replacement spec (JSON/MD)")
    caption: str = Field(..., description="Brief caption under the visual")
