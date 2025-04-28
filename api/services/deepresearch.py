import asyncio  # ensure asyncio is imported

import os

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
from services.utils.pdf_parser import extract_pdf_from_s3, parse_pdf_structure

from services.utils.kb_search import query_kb, get_presigned_url_from_source_uri
from services.utils.websearch_utils import call_tavily_api


import asyncio, os
from services.deep_research.state import SearchResult, Citation, KBCitation, WebCitation, ExcelCitation
from services.utils.excel_utils import extract_excel_index, has_excel_files
from services.deep_research.state import ReportState, ReportConfig
from typing import Dict, List, TypedDict, Any, Optional, Tuple, Annotated, Union
from services.deep_research.graph import report_graph_compiled



from services.deep_research.config import Configuration
from services.deep_research.state import ReportState, SectionState
from services.deep_research.llm import gpt_4

# ------------------------------------------------------------------------
# HELPER: Format completed sections, Call llm
# ------------------------------------------------------------------------
CITATIONS: List[Citation] = []

#
ENC = tiktoken.get_encoding("cl100k_base")
MAX_TOKENS = 400000
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

def trim_to_tokens(text: str, max_tokens: int = MAX_TOKENS) -> str:
    tokens = ENC.encode(text)
    if len(tokens) <= max_tokens:
        return text
    # Keep the first N tokens and decode back
    return ENC.decode(tokens[:max_tokens])

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


#deep-research function
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
