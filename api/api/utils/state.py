from typing import Annotated, List, TypedDict
from pydantic import BaseModel, Field
import operator


class Section(BaseModel):
    """Represents a section of the report."""
    name: str = Field(description="Name for this section of the report.")
    description: str = Field(description="Brief overview of the main topics.")
    research: bool = Field(description="Whether we need to query local docs.")
    content: str = Field(default="", description="The content of this section.")


class Sections(BaseModel):
    """Represents a list of sections for the report."""
    sections: List[Section] = Field(description="List of sections for the report.")


class SearchQuery(BaseModel):
    """Represents a search query relevant for a section."""
    search_query: str = Field(..., description="A doc query relevant for the section.")


class Queries(BaseModel):
    """Represents a list of document queries."""
    queries: List[SearchQuery] = Field(description="List of doc queries.")


class ReportStateInput(TypedDict):
    """Input state for generating a report."""
    topic: str


class ReportStateOutput(TypedDict):
    """Output state after generating a report."""
    final_report: str


class ReportState(TypedDict, total=False):
    """Represents the state of the report generation process."""
    topic: str
    user_id: str
    report_type: int
    sections: List[Section]
    completed_sections: Annotated[List[Section], operator.add]
    report_sections_from_research: str
    final_report: str


class SectionState(TypedDict):
    """Represents the state of an individual section in the report."""
    section: Section
    report_type: int
    search_queries: List[SearchQuery]
    source_str: str
    report_sections_from_research: str
    completed_sections: List[Section]