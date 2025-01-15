import uuid
import boto3
from common_logging import loginfo, logerror
from fastapi import APIRouter, HTTPException, Query, Depends, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Dict
from datetime import datetime, timedelta
from api.api_user import get_current_user
from db_models.rag_session import RagSession
from db_models.session import get_db
import json
import os
import asyncio

# Import your existing document processing code
from .customize_reports import (
    process_uploaded_documents,
    generate_structured_report,
    get_index_from_storage,
    BASE_PERSIST_DIR,
)

# Initialize the new router for document processing
document_router = APIRouter()

# Helper functions for session management (reused from your existing code)
def load_session_from_db(session_id: str, db: Session) -> Dict:
    """Load session from the database."""
    try:
        session = db.query(RagSession).filter(RagSession.session_id == session_id).first()
        if session:
            return {
                "user_id": session.user_id,
                "last_access_time": session.last_access_time,
                "data": session.data,
            }
    except Exception as e:
        logerror(f"Error loading session {session_id}: {e}")
    return None

def save_session_to_db(session_id: str, user_id: str, data: dict, db: Session):
    """Save or update a session in the database."""
    try:
        existing_session = db.query(RagSession).filter(RagSession.session_id == session_id).first()
        if existing_session:
            loginfo(f"Updating existing session {session_id}")
            existing_session.last_access_time = datetime.utcnow()
            existing_session.data = data
        else:
            loginfo(f"Creating new session {session_id}")
            new_session = RagSession(
                session_id=session_id,
                user_id=user_id,
                last_access_time=datetime.utcnow(),
                data=data,
            )
            db.add(new_session)
        db.commit()
        loginfo(f"Successfully saved session {session_id}")
    except Exception as e:
        logerror(f"Error saving session {session_id}: {e}")
        db.rollback()
        raise

def validate_and_refresh_session(session_id: str, user_id: str, db: Session):
    """Validate and refresh session to ensure it is active and belongs to the user."""
    try:
        session = db.query(RagSession).filter(RagSession.session_id == session_id, RagSession.user_id == user_id).first()
        if not session:
            raise HTTPException(status_code=403, detail="Session does not belong to this user.")

        now = datetime.utcnow()
        if now - session.last_access_time > SESSION_TIMEOUT:
            raise HTTPException(status_code=401, detail="Session expired.")

        session.last_access_time = now
        db.commit()
    except Exception as e:
        logerror(f"Error validating session {session_id}: {e}")
        raise

def create_new_session(user_id: str, db: Session) -> str:
    """Create a new session for a user."""
    try:
        session_id = str(uuid.uuid4())
        new_session = RagSession(
            session_id=session_id,
            user_id=user_id,
            last_access_time=datetime.utcnow(),
            data={}
        )
        db.add(new_session)
        db.commit()
        loginfo(f"New session created with ID {session_id}")
        return session_id
    except Exception as e:
        logerror(f"Error creating new session: {e}")
        db.rollback()
        raise

# Helper function to save uploaded files
async def save_uploaded_files(files: List[UploadFile]) -> List[str]:
    saved_paths = []
    for file in files:
        file_path = f"./uploads/{file.filename}"
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        saved_paths.append(file_path)
    return saved_paths

# Endpoint to upload and process documents
@document_router.post("/api/upload-documents")
async def upload_documents(
    files: List[UploadFile] = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    ):
    user_id = current_user.id
    deal_id = str(uuid.uuid4())  # Generate a unique deal ID for this upload

    try:
        # Save uploaded files to disk
        file_paths = await save_uploaded_files(files)

        # Process the uploaded documents
        success = await process_uploaded_documents(file_paths, user_id, deal_id)

        if not success:
            raise HTTPException(status_code=500, detail="Failed to process documents")

        # Save the session with the deal ID
        session_id = create_new_session(user_id, db)
        save_session_to_db(session_id, user_id, {"deal_id": deal_id, "file_paths": file_paths}, db)

        return JSONResponse(
            content={
                "message": "Documents processed successfully",
                "session_id": session_id,
                "deal_id": deal_id,
            },
            status_code=200,
        )
    except Exception as e:
        logerror(f"Error in upload_documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint to generate a structured report
@document_router.post("/api/generate-report")
async def generate_report(
    query: dict,
    session_id: str = Query(..., description="Active session ID"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user.id

    try:
        # Validate the session
        validate_and_refresh_session(session_id, user_id, db)

        # Retrieve the deal ID from the session
        session_data = load_session_from_db(session_id, db)
        if not session_data or "deal_id" not in session_data["data"]:
            raise HTTPException(status_code=404, detail="No processed documents found for this session.")

        deal_id = session_data["data"]["deal_id"]

        # Generate the structured report
        report = await generate_structured_report(query, user_id, deal_id)

        if not report:
            raise HTTPException(status_code=404, detail="Failed to generate report.")

        # Save the report to the session
        session_data["data"]["report"] = report
        save_session_to_db(session_id, user_id, session_data["data"], db)

        return JSONResponse(
            content={"message": "Report generated successfully", "report": report},
            status_code=200,
        )
    except Exception as e:
        logerror(f"Error in generate_report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint to retrieve the generated report
@document_router.get("/api/get-report")
async def get_report(
    session_id: str = Query(..., description="Active session ID"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user.id

    try:
        # Validate the session
        validate_and_refresh_session(session_id, user_id, db)

        # Retrieve the report from the session
        session_data = load_session_from_db(session_id, db)
        if not session_data or "report" not in session_data["data"]:
            raise HTTPException(status_code=404, detail="No report found for this session.")

        report = session_data["data"]["report"]

        return JSONResponse(
            content={"message": "Report retrieved successfully", "report": report},
            status_code=200,
        )
    except Exception as e:
        logerror(f"Error in get_report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the new router in the main FastAPI app
# Example:
# from fastapi import FastAPI
# app = FastAPI()
# app.include_router(document_router)