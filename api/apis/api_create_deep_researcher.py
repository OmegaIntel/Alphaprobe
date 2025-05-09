import time
from typing import List
from enum import Enum
from pydantic import BaseModel
import logging
from fastapi.responses import JSONResponse
from api.apis.api_get_current_user import get_current_user
from fastapi import APIRouter, Depends, HTTPException
from db_models.documents import DocumentTable
from db_models.reports import ReportTable
from db_models.projects import Project
from db.db_session import get_db
from sqlalchemy.orm import Session
from api.services.deep_research.deep_research import deep_research
from api.services.researcher.researcher import generate_report
from dotenv import load_dotenv, find_dotenv

env_path = find_dotenv()  # walks up until it finds .env
loaded = load_dotenv(env_path)

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


# ------------------------------------------------------------------------
# CLASSES
# ------------------------------------------------------------------------
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


# ------------------------------------------------------------------------
# ROUTER
# ------------------------------------------------------------------------
create_research_deep_router = APIRouter()


@create_research_deep_router.post("/api/deep-researcher-langgraph/create")
async def deep_research_tool(
    query: InstructionRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        user_id = current_user.id

        # Create project with retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:
                project = Project(
                    name=query.instruction,
                    temp_project_id=query.temp_project_id,
                    user_id=user_id,
                    workflow=query.workflow,
                )
                db.add(project)
                db.commit()
                db.refresh(project)
                break
            except Exception as e:
                if attempt == max_retries - 1:
                    raise
                db.rollback()
                time.sleep(1)  # Wait before retrying

        if query.file_search:
            files = query.uploaded_files
            for file in files:
                document = DocumentTable(
                    project_id=project.id,
                    file_name=file.file_name,
                    file_path=file.file_path,
                )
                db.add(document)
            db.commit()

        # Run research
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

        if result is None:
            raise HTTPException(
                status_code=500, detail="Research failed to generate results"
            )

        # Save report with retry logic
        for attempt in range(max_retries):
            try:
                report = ReportTable(
                    project_id=project.id,
                    query=query.instruction,
                    response=result.get("report", ""),
                    sections=result.get("sections", []),
                    citations=result.get("citations", []),
                    research=query.researchType,
                )
                db.add(report)
                db.commit()
                break
            except Exception as e:
                if attempt == max_retries - 1:
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to save report after multiple attempts",
                    )
                db.rollback()
                time.sleep(1)

        return JSONResponse(
            content={
                "message": "Research generated successfully",
                "data": {
                    "report": result.get("report", ""),
                    "citations": result.get("citations", []),
                    "researchType": query.researchType,
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

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
