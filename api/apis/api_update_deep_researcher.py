import time
from typing import List
from enum import Enum
from pydantic import BaseModel
import logging
from fastapi.responses import JSONResponse
from apis.api_get_current_user import get_current_user
from fastapi import APIRouter, Depends, HTTPException
from db_models.reports import ReportTable
from db_models.projects import Project
from db.db_session import get_db
from sqlalchemy.orm import Session
from sqlalchemy import func
from services.deep_research.deep_research import deep_research
from services.researcher.researcher import generate_report
from dotenv import load_dotenv, find_dotenv

env_path = find_dotenv()  # walks up until it finds .env
loaded = load_dotenv(env_path)


update_deep_researcher_router = APIRouter()

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("app.log"),
    ],
)

logger = logging.getLogger(__name__)


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
    file_search: bool
    web_search: bool
    project_id: str
    temp_project_id: str
    uploaded_files: List[UploadedFileData]
    researchType: str
    workflow: WorkflowEnum = WorkflowEnum.general


@update_deep_researcher_router.post("/api/deep-researcher-langgraph/update")
async def deep_research_tool_update(
    query: InstructionRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an existing research project with new research data"""
    MAX_RETRIES = 3
    RETRY_DELAY = 1  # seconds

    try:
        user_id = current_user.id

        # Validate project exists
        project = db.query(Project).filter(Project.id == query.project_id).first()
        if not project:
            return JSONResponse(
                content={"message": "Project not found", "data": None}, status_code=404
            )

        # Run research with proper state handling
        result = None
        for attempt in range(MAX_RETRIES):
            try:
                if query.researchType == "deep":
                    result = await deep_research(
                        query.instruction,
                        int(query.report_type),
                        query.file_search,
                        query.web_search,
                        query.temp_project_id,
                        user_id,
                    )
                else:
                    result = await generate_report(
                        query.instruction,
                        int(query.report_type),
                        query.file_search,
                        query.web_search,
                        query.temp_project_id,
                        user_id,
                    )
                break
            except Exception as e:
                if attempt == MAX_RETRIES - 1:
                    raise
                time.sleep(RETRY_DELAY)
                continue

        if result is None:
            raise HTTPException(
                status_code=500,
                detail="Research failed to generate results after multiple attempts",
            )

        # Convert result if needed
        final_report = result.get("report", "")
        sections = result.get("sections", [])

        # Save report with transaction and retry logic
        for attempt in range(MAX_RETRIES):
            try:
                # Start transaction
                db.begin()

                # Create new report entry
                report = ReportTable(
                    project_id=query.project_id,
                    query=query.instruction,
                    response=final_report,
                    sections=sections,
                    research=query.researchType,
                )
                db.add(report)

                # Update project timestamp
                project.updated_at = func.now()
                db.add(project)

                # Commit transaction
                db.commit()
                db.refresh(project)
                db.refresh(report)
                break

            except Exception as e:
                db.rollback()
                if attempt == MAX_RETRIES - 1:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to save report after {MAX_RETRIES} attempts",
                    )
                time.sleep(RETRY_DELAY)
                continue

        return JSONResponse(
            content={
                "message": "Research updated successfully",
                "data": {
                    "report": final_report,
                    "sections": sections,
                    "research": query.researchType,
                    "project": {
                        "id": str(project.id),
                        "name": project.name,
                        "temp_project_id": (
                            str(project.temp_project_id)
                            if project.temp_project_id
                            else None
                        ),
                        "user_id": str(project.user_id),
                        "created_at": (
                            project.created_at.isoformat()
                            if project.created_at
                            else None
                        ),
                        "updated_at": (
                            project.updated_at.isoformat()
                            if project.updated_at
                            else None
                        ),
                    },
                },
            },
            status_code=200,
        )

    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        db.rollback()
        logger.error(f"Error in deep_research_tool_update: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )
