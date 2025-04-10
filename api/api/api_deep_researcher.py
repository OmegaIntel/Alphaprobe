import os
import uuid
import time
import json
from typing import List

from pydantic import BaseModel
import logging
from fastapi.responses import JSONResponse
from api.api_user import get_current_user
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException,Query
import boto3, botocore, uuid
from db_models.documents import DocumentTable
from db_models.reports import ReportTable
from db_models.projects import Project
from db_models.session import get_db
from sqlalchemy.orm import Session
from sqlalchemy import func, asc, desc

from services.deep_research import deep_research
from services.researcher import generate_report


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

s3_client = boto3.client(
    "s3",
    aws_access_key_id="AKIA5FTZD4AADPXMJD7C",
    aws_secret_access_key="k1OveeJ7XKxO1PExUSTk/NulLMWkFjYwlXGrmQR/",
    region_name="us-east-1"  # Change to your AWS region
)

bedrock_client = boto3.client('bedrock-agent',
    aws_access_key_id="AKIA5FTZD4AADPXMJD7C",
    aws_secret_access_key="k1OveeJ7XKxO1PExUSTk/NulLMWkFjYwlXGrmQR/",
    region_name="us-east-1"
)  # for control-plane ops like ingestion

bedrock_runtime = boto3.client('bedrock-agent-runtime',
    aws_access_key_id="AKIA5FTZD4AADPXMJD7C",
    aws_secret_access_key="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",
    region_name="us-east-1"
)
 
EXCEL_BUCKET_NAME = os.getenv("EXCEL_BUCKET_NAME", "kb-bucket-tester")
BUCKET_NAME = os.getenv("BUCKET_NAME", "deep-research-docs")
KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID")
DATA_SOURCE_ID = os.getenv("DATA_SOURCE_ID")
MODEL_ARN = os.getenv("MODEL_ARN")



# ------------------------------------------------------------------------
# ROUTER
# ------------------------------------------------------------------------
research_deep_router = APIRouter()

class UploadedFileData(BaseModel):
    file_name: str
    file_path: str


class InstructionRequest(BaseModel):
    instruction: str
    report_type: int 
    file_search:bool
    web_search:bool
    project_id: str
    temp_project_id:str
    uploaded_files: List[UploadedFileData]
    researchType: str


@research_deep_router.post("/api/deep-researcher-langgraph/create")
async def deep_research_tool(query: InstructionRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Example usage:
      1. Build or load the index from local data. 
      2. Create a query engine.
      3. Set the global query engine.
      4. Run the state machine with a topic.
    """

    user_id = current_user.id

    print(f"user-email-------------------------------", current_user.id)
    #priject
    project = Project(name=query.instruction, temp_project_id=query.temp_project_id, user_id=user_id)  # No need to manually set `id`
    db.add(project)
    db.commit()
    db.refresh(project)  # This will assign the auto-generated `id`

    if query.file_search:
        files = query.uploaded_files
        for file in files:
            document = DocumentTable(project_id=project.id, file_name=file.file_name, file_path=file.file_path)
            db.add(document)
        db.commit()

    
    print(f"user-email-------------------------------", current_user)
    # Step 4: Prepare your input state.
    # input_data = {"topic": query.instruction, "user_id": user_id, "report_type":int(query.report_type), "file_search": query.file_search, "web_search": query.web_search, "project_id": query.temp_project_id}
    
    # Step 5: Invoke the state graph.
    result = None
    if query.researchType == "deep":
        result = await deep_research(query.instruction, int(query.report_type), query.file_search, query.web_search, query.temp_project_id, user_id)
    else: 
        result = await generate_report(query.instruction, int(query.report_type), query.file_search, query.web_search, query.temp_project_id, user_id)
    
    if result is None:
        print("[ERROR] The state graph returned None. Check the graph flow and node return values.")

    else:
        final_report = result.get("report", "")
        sections = result.get("sections", [])
        
        report = ReportTable(project_id=project.id, query=query.instruction, response=final_report, sections=sections, research=query.researchType)
        db.add(report)
        db.commit()

        

        return JSONResponse(
        content={
            "message": "Research generated successfully",
            "data": {
                "report":final_report,
                "sections": sections,
                "researchType": query.researchType,
                "project": {
                    "id": str(project.id),
                    "name": project.name,
                    "temp_project_id": str(project.temp_project_id) if project.temp_project_id else None,
                    "user_id": str(project.user_id),
                    "created_at": project.created_at.isoformat()if project.created_at else None,
                    "updated_at": project.updated_at.isoformat() if project.updated_at else None
                }
            }
        },
        status_code=200
    )



@research_deep_router.post("/api/deep-researcher-langgraph/update")
async def deep_research_tool_update(query: InstructionRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Example usage: 
      1. Build or load the index from local data.
      2. Create a query engine.
      3. Set the global query engine.
      4. Run the state machine with a topic.
    """

    user_id = current_user.id
    # Step 4: Prepare your input state.
    # input_data = {"topic": query.instruction, "user_id": user_id, "report_type":int(query.report_type), "file_search": query.file_search, "web_search": query.web_search, "project_id": query.temp_project_id}
    
    # Step 5: Invoke the state graph.
    result = None
    if query.researchType == "deep":
        result = await deep_research(query.instruction, int(query.report_type), query.file_search, query.web_search, query.temp_project_id, user_id)
    else: 
        result = await generate_report(query.instruction, int(query.report_type), query.file_search, query.web_search, query.temp_project_id, user_id)

    
    if result is None:
        print("[ERROR] The state graph returned None. Check the graph flow and node return values.")
    else:
        final_report = result.get("report", "")
        sections = result.get("sections", [])

        
        report = ReportTable(project_id=query.project_id, query=query.instruction, response=final_report, sections=sections, research=query.researchType)
        db.add(report)
        db.commit()

        project = db.query(Project).filter(Project.id == query.project_id).first()
        if not project:
            return JSONResponse(
               content={
                  "message": "project not found",
                  "data": None
               },
               status_code=404 
            )

        project.updated_at = func.now()
        db.commit()
        db.refresh(project)


        return JSONResponse(
        content={
            "message": "Research generated successfully",
            "data": {
                "report":final_report,
                "sections": sections,
                "research": query.researchType,
                "project": {
                    "id": str(project.id),
                    "name": project.name,
                    "temp_project_id": str(project.temp_project_id) if project.temp_project_id else None,
                    "user_id": str(project.user_id),
                    "created_at": project.created_at.isoformat()if project.created_at else None,
                    "updated_at": project.updated_at.isoformat() if project.updated_at else None
                }
            }
        },
        status_code=200 
    )

class UploadRequest(BaseModel):
    files: List[UploadFile] = File(...)
    project_id: str
    temp_project_id:str

@research_deep_router.post("/api/upload-deep-research")
async def upload_files(files: List[UploadFile] = File(...), temp_project_id: str = Form(...), current_user=Depends(get_current_user)):
    user_id = current_user.id
    results = []
    
    for file in files:
        # Determine the target bucket based on file type.
        # If Excel file, use EXCEL_BUCKET_NAME; otherwise, use the default BUCKET_NAME.
        if file.filename.lower().endswith(('.xls', '.xlsx')):
            target_bucket = EXCEL_BUCKET_NAME
        else:
            target_bucket = BUCKET_NAME

        key = f"{user_id}/{temp_project_id}/{file.filename}"
        
        try:
            # Upload the file to S3 with metadata
            s3_client.upload_fileobj(
                file.file, 
                target_bucket, 
                key, 
                ExtraArgs={"Metadata": {"user_id": str(user_id)}}
            )

            # Prepare metadata content
            metadata_dict = {
                "metadataAttributes": {
                    "user_id": str(user_id),
                    "project_id": str(temp_project_id)
                }
            }
            metadata_content = json.dumps(metadata_dict)
            metadata_key = f"{key}.metadata.json"
            
            # Upload the metadata file to the same bucket
            s3_client.put_object(
                Bucket=target_bucket,
                Key=metadata_key,
                Body=metadata_content,
                ContentType='application/json'
            )
        except botocore.exceptions.ClientError as e:
            raise HTTPException(status_code=500, detail=f"Upload to S3 failed for file: {file.filename}")

        results.append({"file_name": file.filename, "file_path": key, "bucket": target_bucket})

        # Retry ingestion job up to 3 times if it fails
        max_retries = 3  
        for attempt in range(1, max_retries + 1):
            try:
                bedrock_client.start_ingestion_job(
                    knowledgeBaseId=KNOWLEDGE_BASE_ID,
                    dataSourceId=DATA_SOURCE_ID,
                    clientToken=str(uuid.uuid4())
                )
                # Ingestion job started successfully, break out of the retry loop.
                break
            except botocore.exceptions.ClientError as e:
                print(f"Ingestion job attempt {attempt} failed for key: {key}")
                print("Error details:", e.response)
                if attempt == max_retries:
                    # After max retries, log and move on.
                    print(f"Max retries reached for key: {key}. Moving on to next file.")
                else:
                    # Wait for a short period before retrying.
                    time.sleep(1)
    
    return JSONResponse(
        content={
            "message": "Files uploaded successfully",
            "data": results
        },
        status_code=200
    )


@research_deep_router.get("/api/project-list")
def get_all_projects_sorted_by_updated_at(
    current_user=Depends(get_current_user), 
    db: Session = Depends(get_db),
    limit: int = Query(10, description="Number of projects to return"),
    offset: int = Query(0, description="Number of projects to skip")
):
    try:
        user_id = current_user.id
        
        # Get total count for pagination metadata
        total_count = db.query(Project).filter(Project.user_id == user_id).count()
        
        # Fetch projects with pagination applied
        projects = db.query(Project).filter(
            Project.user_id == user_id
        ).order_by(
            desc(Project.updated_at)
        ).offset(offset).limit(limit).all()

        if not projects and offset == 0:
            raise HTTPException(status_code=404, detail="No projects found")
        
        fetched_projects = [
            {
                "id": str(project.id),
                "name": str(project.name),
                "updated_at": str(project.updated_at),  
                "temp_project_id": str(project.temp_project_id),
                "user_id": str(project.user_id),
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
                    "has_more": offset + limit < total_count
                }
            },
            status_code=200
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    
@research_deep_router.get("/api/project/{project_id}/reports")
def get_reports_sorted_by_updated_at(project_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # 1️⃣ **Fetch reports for a given project, sorted by `updated_at` (oldest first)**
        reports = db.query(ReportTable).filter(ReportTable.project_id == project_id).order_by(asc(ReportTable.updated_at)).all()

        if not reports:
            raise HTTPException(status_code=404, detail="No reports found for this project")

        fetched_reports = [
                {
                    "id": str(report.id),
                    "query": str(report.query),
                    "response": str( report.response),
                    "updated_at": str(report.updated_at),
                    "sections": report.sections,
                    "research" : str(report.research)
                }
                for report in reports
            ]

        return JSONResponse(
            content={
               "message": "Reports fetched successfully",
               "data": fetched_reports
            },
            status_code=200
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")