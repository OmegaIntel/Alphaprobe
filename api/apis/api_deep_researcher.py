import os
import uuid
import time
import json
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel
import logging
from fastapi.responses import JSONResponse
from apis.api_user import get_current_user
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, Query
import boto3, botocore, uuid
from db_models.documents import DocumentTable
from db_models.reports import ReportTable
from db_models.projects import Project
from db.db_session import get_db
from sqlalchemy.orm import Session
from sqlalchemy import func, asc, desc
from utils.aws_utils import AwsUtlis
from api.services.deep_research.deep_research import deep_research
from api.services.researcher.researcher import generate_report
from utils.excel_utils import build_or_load_excel_index
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
# Knowledge-base implementation
# ------------------------------------------------------------------------
import boto3

s3_client = AwsUtlis.get_s3_client()

bedrock_client = AwsUtlis.get_bedrock_agent()

bedrock_runtime = AwsUtlis.get_bedrock_agent_runtime()
# ------------------------------------------------------------------------

EXCEL_BUCKET_NAME = os.getenv("EXCEL_BUCKET_NAME", "excel-file-indexes")
OUTLINE_BUCKET_NAME = os.getenv("OUTLINE_BUCKET_NAME", "outline-helper")
BUCKET_NAME = os.getenv("BUCKET_NAME", "deep-research-docs")
KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID")
DATA_SOURCE_ID = os.getenv("DATA_SOURCE_ID")
MODEL_ARN = os.getenv("MODEL_ARN")


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


class UploadRequest(BaseModel):
    files: List[UploadFile] = File(...)
    project_id: str
    temp_project_id: str


# ------------------------------------------------------------------------
# ROUTER
# ------------------------------------------------------------------------
research_deep_router = APIRouter()


@research_deep_router.post("/api/deep-researcher-langgraph/create")
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
                    "sections": result.get("sections", []),
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


@research_deep_router.post("/api/deep-researcher-langgraph/update")
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


@research_deep_router.post("/api/upload-deep-research")
async def upload_files(
    files: List[UploadFile] = File(...),
    temp_project_id: str = Form(...),
    current_user=Depends(get_current_user),
):
    user_id = current_user.id
    results = []

    # Upload every file into the same file bucket (BUCKET_NAME)
    for file in files:
        key = f"{user_id}/{temp_project_id}/{file.filename}"
        try:
            s3_client.upload_fileobj(
                file.file,
                BUCKET_NAME,
                key,
                ExtraArgs={
                    "Metadata": {
                        "user_id": str(user_id),
                        "project_id": str(temp_project_id),
                    }
                },
            )

            # Optionally, upload additional metadata as a separate JSON object.
            metadata_dict = {
                "metadataAttributes": {
                    "user_id": str(user_id),
                    "project_id": str(temp_project_id),
                }
            }
            metadata_content = json.dumps(metadata_dict)
            metadata_key = f"{key}.metadata.json"
            s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=metadata_key,
                Body=metadata_content,
                ContentType="application/json",
            )
        except botocore.exceptions.ClientError as e:
            raise HTTPException(
                status_code=500, detail=f"Upload to S3 failed for file: {file.filename}"
            )
        results.append(
            {"file_name": file.filename, "file_path": key, "bucket": BUCKET_NAME}
        )

        # Close prev ingestion jobs
        AwsUtlis.close_previous_ingestion_jobs()

        # Start non-Excel ingestion job with retries if needed.
        max_retries = 3
        for attempt in range(1, max_retries + 1):
            try:
                bedrock_client.start_ingestion_job(
                    knowledgeBaseId=KNOWLEDGE_BASE_ID,
                    dataSourceId=DATA_SOURCE_ID,
                    clientToken=str(uuid.uuid4()),
                    description="starting ingestion",
                )
                break  # Exit retry loop if successful.
            except botocore.exceptions.ClientError as e:
                print(f"Ingestion job attempt {attempt} failed for key: {key}")
                print("Error details:", e.response)
                if attempt == max_retries:
                    print(
                        f"Max retries reached for key: {key}. Moving on to next file."
                    )
                else:
                    time.sleep(1)

    # After all files are uploaded, check if any Excel files were submitted.
    excel_file_uploaded = any(
        file.filename.lower().endswith((".xls", ".xlsx")) for file in files
    )
    if excel_file_uploaded:
        # Call the index builder function to process Excel files from the file bucket
        # and upload the resulting index into the separate index bucket.
        index = build_or_load_excel_index(user_id, temp_project_id)
        if index is None:
            print("[DEBUG] No Excel index was created.")
        else:
            print("[DEBUG] Excel index successfully built and uploaded.")

    return JSONResponse(
        content={"message": "Files uploaded successfully", "data": results},
        status_code=200,
    )


@research_deep_router.get("/api/project-list")
def get_all_projects_sorted_by_updated_at(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(10),
    offset: int = Query(0),
    workflow: Optional[str] = Query(None),  # 👈 NEW
):
    try:
        user_id = current_user.id
        query = db.query(Project).filter(Project.user_id == user_id)
        if workflow:
            query = query.filter(Project.workflow == workflow)

        total_count = query.count()
        projects = (
            query.order_by(desc(Project.updated_at)).offset(offset).limit(limit).all()
        )

        fetched_projects = [
            {
                "id": str(project.id),
                "name": str(project.name),
                "updated_at": str(project.updated_at),
                "temp_project_id": str(project.temp_project_id),
                "user_id": str(project.user_id),
                "workflow": str(project.workflow),
            }
            for project in projects
        ]

        return JSONResponse(
            content={
                "message": "Projects fetched successfully",
                "data": fetched_projects,
                "pagination": {
                    "total": total_count,
                    "offset": offset,
                    "limit": limit,
                    "has_more": offset + limit < total_count,
                },
            },
            status_code=200,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@research_deep_router.get("/api/project/{project_id}/reports")
def get_reports_sorted_by_updated_at(
    project_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        # 1️⃣ **Fetch reports for a given project, sorted by `updated_at` (oldest first)**
        reports = (
            db.query(ReportTable)
            .filter(ReportTable.project_id == project_id)
            .order_by(asc(ReportTable.updated_at))
            .all()
        )

        if not reports:
            raise HTTPException(
                status_code=404, detail="No reports found for this project"
            )

        fetched_reports = [
            {
                "id": str(report.id),
                "query": str(report.query),
                "response": str(report.response),
                "updated_at": str(report.updated_at),
                "sections": report.sections,
                "research": str(report.research),
            }
            for report in reports
        ]

        return JSONResponse(
            content={
                "message": "Reports fetched successfully",
                "data": fetched_reports,
            },
            status_code=200,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@research_deep_router.post("/api/upload-outline-file")
async def upload_files(
    files: UploadFile = File(...),
    temp_project_id: str = Form(...),
    current_user=Depends(get_current_user),
):
    user_id = current_user.id
    key = f"{user_id}/{temp_project_id}/{files.filename}"

    try:
        # Upload the file to S3
        s3_client.upload_fileobj(
            files.file,
            OUTLINE_BUCKET_NAME,
            key,
            ExtraArgs={
                "Metadata": {
                    "user_id": str(user_id),
                    "project_id": str(temp_project_id),
                }
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload to S3 failed: {str(e)}")

    return JSONResponse(
        content={
            "message": "File uploaded successfully",
            "file_name": files.filename,
            "file_path": key,
            "bucket": OUTLINE_BUCKET_NAME,
        },
        status_code=200,
    )
