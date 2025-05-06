from typing import List, TypedDict, Any, Optional, Tuple
from pydantic import BaseModel
from dataclasses import dataclass


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
    citations: List[dict[str, Any]]


class ReportState(TypedDict):
    topic: str
    user_id: str
    project_id: str
    headings: List[str]
    index: str
    outline: str
    questions: List[Tuple[str, str]]
    questions_by_section: List[dict[str, Any]]
    citations: List[dict[str, Any]]
    answers: List[Tuple[str, str]]
    previous_questions: List[Tuple[str, str]]
    report: str
    web_search: bool
    file_search: bool


class InstructionRequest(BaseModel):
    query: str
    report_type: int
    file_search: bool
    web_search: bool
    project_id: str


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
