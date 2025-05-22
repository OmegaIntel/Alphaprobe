# api/update_research.py
import time, logging, os
from typing import List
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from api.apis.api_get_current_user import get_current_user
from db_models.projects import Project
from db_models.reports  import ReportTable
from db.db_session      import get_db

from api.services.update_flow.update_flow   import run_update_graph      # ⬅ service fn
from api.services.deep_research.deep_research import (
    outline_dicts_to_section_states,
    deduplicate_citations,
    citation_to_dict,
)

from api.services.update_flow.schema import ReportState, ReportConfig  # ⬅ NEW

update_graph_router = APIRouter()

# ─────────────── logging ────────────────
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("app.log")],
)
logger = logging.getLogger(__name__)

# ─────────────── request schema ─────────
class UploadedFileData(BaseModel):
    file_name: str
    file_path: str

class WorkflowEnum(str, Enum):
    general = "general"
    due_diligence = "due_diligence"
    market_research = "market_research"
    competitive_analysis = "competitive_analysis"

class InstructionRequest(BaseModel):
    instruction: str
    report_type: int
    file_search: bool = True
    web_search:  bool = True
    project_id: str
    temp_project_id: str
    uploaded_files: List[UploadedFileData] = []
    researchType: str
    workflow: WorkflowEnum = WorkflowEnum.general

# ──────────────────────────── router ─────────────────────────────
@update_graph_router.post("/api/update-report")
async def deep_research_tool_update(
    body: InstructionRequest,
    current_user = Depends(get_current_user),
    db: Session  = Depends(get_db),
):
    user_id = current_user.id
    MAX_RETRIES, RETRY_DELAY = 3, 1

    # 1️⃣  Validate project -------------------------------------------------
    project = db.query(Project).filter(Project.id == body.project_id).first()
    if not project:
        return JSONResponse(status_code=404,
                            content={"message": "Project not found", "data": None})

    # 2️⃣  Load latest report row (must exist to update) -------------------
    last = (
        db.query(ReportTable)
          .filter(ReportTable.project_id == body.project_id)
          .order_by(ReportTable.updated_at.desc())
          .first()
    )
    if not last:
        raise HTTPException(status_code=400,
                            detail="No existing report to update. Generate one first.")

    # 3️⃣  Convert DB outline → SectionState list --------------------------
    outline = getattr(last, "sections", []) or []
    outline_ss = outline_dicts_to_section_states(
        outline,
        web_research = body.web_search,
        file_search  = body.file_search,
        excel_search = False,                 # set your own excel flag logic
        report_type  = body.report_type,
    )

    report_state = ReportState(
        topic        = last.query,
        user_id      = user_id,
        project_id   = body.project_id,
        report_type  = body.report_type,
        file_search  = body.file_search,
        web_research = body.web_search,
        config       = ReportConfig(
            web_research = body.web_search,
            file_search  = body.file_search,
        ),
        outline      = outline_ss,
        old_report= last.response,
        exists       = True,
    )

    logger.info(f"[DEBUG] ReportState titles: {report_state.outline[0].title}")
    # 4️⃣  Run the update graph (service layer) ----------------------------
    for attempt in range(MAX_RETRIES):
        try:
            updated_state: ReportState = await run_update_graph(
                state        = report_state,
                update_query = body.instruction,
            )
            break
        except Exception as e:
            logger.warning("Graph attempt %d failed: %s", attempt+1, e, exc_info=True)
            if attempt == MAX_RETRIES - 1:
                raise HTTPException(
                    status_code=500,
                    detail="Update graph failed after retries",
                )
            time.sleep(RETRY_DELAY)

    # 5️⃣  Gather & dedupe citations --------------------------------------
    all_cits = []
    for sec in updated_state.outline:
        all_cits.extend(sec.citations)
    citations_dicts = [citation_to_dict(c) for c in deduplicate_citations(all_cits)]

    # 6️⃣  Persist new report row -----------------------------------------
    try:
        new_rec = ReportTable(
            project_id = body.project_id,
            query      = body.instruction,
            response   = updated_state.final_report,
            sections   = [
                {"title": s.title,
                "description": s.description,
                "content": s.content,
                "citations": [citation_to_dict(c) for c in s.citations]}
                for s in updated_state.outline
            ],
            citations  = citations_dicts,
            research   = "deep",
        )
        db.add(new_rec)
        project.updated_at = func.now()
        db.add(project)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="DB save failed")

    # 7️⃣  API response ----------------------------------------------------
    return JSONResponse(
        status_code=200,
        content={
            "message": "Research updated successfully",
            "data": {
                "report":    updated_state.final_report,
                "outline":   [s.title for s in updated_state.outline],
                "citations": citations_dicts,
                "project":   {
                    "id":           str(project.id),
                    "temp_project_id": (
                        str(project.temp_project_id) if project.temp_project_id else None
                    ),
                    "updated_at": project.updated_at.isoformat(),
                },
            },
        },
    )
