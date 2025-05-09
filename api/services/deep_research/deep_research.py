import os
import logging
from typing import Any, Dict, List, Union

# Configure root logger for debug output
logger = logging.getLogger(__name__)

from utils.excel_utils import has_excel_files
from api.services.deep_research.graph_node import report_graph_compiled
from api.services.deep_research.stats import (
    SearchResult,
    Citation,
    ReportState,
    SectionState,
    ReportConfig,
    KBCitation,
    WebCitation,
    ExcelCitation,
)


# -----------------------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------------------
def deduplicate_citations(citations: List[Citation]) -> List[Citation]:
    unique_kb = {}
    unique_web = {}
    unique_excel = {}
    unique_others = []

    for citation in citations:
        if isinstance(citation, KBCitation):
            key = (citation.file_name, citation.page)
            unique_kb.setdefault(key, citation)
        elif isinstance(citation, ExcelCitation):
            key = (citation.file_name, citation.sheet, citation.row, citation.col)
            unique_excel.setdefault(key, citation)
        elif isinstance(citation, WebCitation):
            key = (citation.title, citation.url)
            unique_web.setdefault(key, citation)
        else:
            if citation not in unique_others:
                unique_others.append(citation)

    return (
        list(unique_kb.values())
        + list(unique_excel.values())
        + list(unique_web.values())
        + unique_others
    )


def validate_report_state(state: Union[ReportState, dict]):
    required = ["final_report", "outline"]
    if isinstance(state, dict):
        for field in required:
            if field not in state:
                raise ValueError(f"Missing required field in state: {field}")
    else:
        for field in required:
            if not hasattr(state, field):
                raise ValueError(f"Missing required attribute in state: {field}")


def citation_to_dict(citation: Citation) -> dict:
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
        return citation.__dict__

def dict_to_citation(obj: Dict[str, Any]) -> Citation:
    """
    Convert a plain dict back into the appropriate Citation subclass,
    by matching on which fields it contains.
    """
    keys = set(obj.keys())

    # KBCitation fields
    kb_fields = {"chunk_text", "page", "file_name", "url"}
    if kb_fields.issubset(keys):
        return KBCitation(
            chunk_text=obj["chunk_text"],
            page=obj.get("page"),
            file_name=obj["file_name"],
            url=obj["url"],
        )

    # WebCitation fields
    web_fields = {"title", "url", "snippet"}
    if web_fields.issubset(keys):
        return WebCitation(
            title=obj["title"],
            url=obj["url"],
            snippet=obj["snippet"],
        )

    # ExcelCitation fields
    excel_fields = {"file_name", "sheet", "row", "col", "value"}
    if excel_fields.issubset(keys):
        return ExcelCitation(
            file_name=obj["file_name"],
            sheet=obj["sheet"],
            row=obj["row"],
            col=obj["col"],
            value=obj["value"],
        )

    # Fallback: pack everything onto a generic Citation object
    generic = Citation()
    for k, v in obj.items():
        setattr(generic, k, v)
    return generic

def outline_dicts_to_section_states(
    outline_dicts: List[Dict],
    web_research: bool,
    file_search: bool,
    excel_search: bool,
    report_type: int
) -> List[SectionState]:
    """
    Convert the JSON‐serializable outline (list of dicts) back into
    a list of SectionState objects for downstream processing.
    """
    states: List[SectionState] = []
    for sec in outline_dicts:
        state = SectionState(
            title=sec.get("title", ""),
            description=sec.get("description", ""),
            # carry over the config flags from the parent ReportState:
            web_research=web_research,
            kb_search=file_search,
            excel_search=excel_search,
            report_type=report_type,
        )
        # restore the content & citations from the dict:
        state.content = sec.get("content", "")
        raw = sec.get("citations", [])
        state.citations = [dict_to_citation(c) for c in raw]
        states.append(state)
    return states

# -----------------------------------------------------------------------------
# MAIN ENTRYPOINT
# -----------------------------------------------------------------------------
async def deep_research(
    instruction: str,
    report_type: int,
    file_search: bool,
    web_search: bool,
    project_id: str,
    user_id: str,
    report_exists: bool = False,
    outline: List[SectionState] = [],
):
    """Execute full research workflow with error handling."""
    # start with a fresh list each run

    logger.debug("=== Starting deep_research workflow ===")

    try:
        # determine if Excel search is available
        excel_flag = has_excel_files(user_id, project_id)
        logger.debug(
            f"Excel available: {excel_flag}, file_search: {file_search}, web_search: {web_search}, report_exists: {report_exists}"
        )

        if report_exists:
            # build the initial state payload
            outline_state = outline_dicts_to_section_states(outline, web_search, file_search, excel_flag, report_type)
            input_data = {
                "topic": instruction,
                "user_id": user_id,
                "project_id": project_id,
                "report_type": int(report_type),
                "file_search": file_search,
                "web_research": web_search,  # <-- renamed from `web_search` to `web_research`
                "excel_search": excel_flag,
                "outline": outline_state,
                "exists": report_exists,
                "update_query": instruction,
                "config": ReportConfig(
                    web_research=web_search,  # <-- matches the ReportConfig field name
                    file_search=file_search,
                    excel_search=excel_flag,
                    section_iterations=2,
                    use_perplexity=True,
                    perplexity_api_key=os.getenv("PERPLEXITY_API_KEY"),
                ),
            }
        else:
            # build the state payload with existing report data
            input_data = {
                "topic": instruction,
                "user_id": user_id,
                "project_id": project_id,
                "report_type": int(report_type),
                "file_search": file_search,
                "web_research": web_search,  # <-- renamed from `web_search` to `web_research`
                "excel_search": excel_flag,
                "config": ReportConfig(
                    web_research=web_search,  # <-- matches the ReportConfig field name
                    file_search=file_search,
                    excel_search=excel_flag,
                    section_iterations=2,
                    use_perplexity=True,
                    perplexity_api_key=os.getenv("PERPLEXITY_API_KEY"),
                ),
            }

        logger.debug(f"\n\n================\n\nInvoking report graph with input: {input_data}\n\n================\n\n")
        graph_result = await report_graph_compiled.ainvoke(input_data,config={
            "configurable": {
                "thread_id": project_id,   # shows up as top-level run id
                "user_id": user_id,                # trace filter
            }
        })
        validate_report_state(graph_result)

        # Map raw dict back into ReportState if necessary
        if not isinstance(graph_result, ReportState):
            logger.debug("Mapping graph_result dict into ReportState object")
            report_state = ReportState(
                topic=graph_result.get("topic", ""),
                user_id=graph_result.get("user_id", ""),
                project_id=graph_result.get("project_id", ""),
                report_type=graph_result.get("report_type", 2),
                file_search=graph_result.get("file_search", False),
                web_research=graph_result.get("web_research", False),
                config=input_data["config"],
                outline=graph_result.get("outline", []),
                current_section_idx=graph_result.get("current_section_idx", 0),
                final_report=graph_result.get("final_report", ""),
            )
        else:
            report_state = graph_result

        logger.debug("=== deep_research workflow completed successfully ===")

        all_citations: List[Citation] = []
        for section in report_state.outline:
            all_citations.extend(section.citations)

        # dedupe and serialize citations
        deduped = deduplicate_citations(all_citations)
        cits = [citation_to_dict(c) for c in deduped]

        return {
            "status": "success",
            "report": report_state.final_report,
            "sections": [{"title": s.title, "description": s.description, "content": s.content, "citations": [c.__dict__ for c in s.citations]} for s in report_state.outline],
            "citations": cits,
        }

    except Exception as e:
        logger.error(f"Research failed: {e}", exc_info=True)
        return {
            "status": "error",
            "message": f"Research failed: {e}",
            "report": "",
            "sections": [],
            "citations": [],
        }
