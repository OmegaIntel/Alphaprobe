import uuid
import boto3
from common_logging import loginfo, logerror
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from typing import Dict
from datetime import datetime, timedelta
from api.api_user import get_current_user
from db_models.rag_session import RagSession
from db_models.session import get_db
import json

rag_router = APIRouter()

region = boto3.session.Session().region_name
if not region:
    region = "us-east-1"

bedrock_agent_runtime_client = boto3.client('bedrock-agent-runtime', region_name=region)
s3_client = boto3.client('s3')

agent_id = "IGC1V40HTU"
agent_alias_id = "CEFQBNZFIC"

SESSION_TIMEOUT = timedelta(minutes=5)

# Helper functions for session management
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

# Helper function for RAG response
def decode_bytes(obj):
    if isinstance(obj, dict):
        return {k: decode_bytes(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [decode_bytes(v) for v in obj]
    if isinstance(obj, bytes):
        return obj.decode('utf8')
    return obj

def generate_presigned_url(bucket_name, key, expiration=3600):
    """Generate a presigned URL for S3."""
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket_name, 'Key': key},
            ExpiresIn=expiration
        )
        return url
    except Exception as e:
        logerror(f"Error generating presigned URL: {e}")
        return None

def simple_agent_invoke(input_text: str, agent_id: str, agent_alias_id: str, session_id: str,
                        enable_trace: bool = True, end_session: bool = False):
    """Invoke the agent and process the response."""
    traces = []
    agent_answer = ''
    try:
        agent_response = bedrock_agent_runtime_client.invoke_agent(
            inputText=input_text,
            agentId=agent_id,
            agentAliasId=agent_alias_id,
            sessionId=session_id,
            enableTrace=enable_trace,
            endSession=end_session
        )
        loginfo(f"Agent response: {agent_response}")

        for event in agent_response.get('completion', []):
            event = decode_bytes(event)
            if 'chunk' in event:
                agent_answer += event['chunk']['bytes']
            elif "trace" in event:
                traces.append(event['trace'])

        return agent_answer, traces, session_id
    except Exception as e:
        logerror(f"Error invoking agent: {e}")
        raise

def extract_metadata_with_content_tabular(trace_data, response, session_id):
    """Extract metadata and content in a tabular format."""
    metadata_content_pairs = []

    for trace in trace_data:
        orchestration_trace = trace.get("trace", {}).get("orchestrationTrace", {})
        observation = orchestration_trace.get("observation", {})
        retrieved_references = observation.get("knowledgeBaseLookupOutput", {}).get("retrievedReferences", [])

        for reference in retrieved_references:
            metadata = reference.get("metadata", {})
            s3_uri = metadata.get("x-amz-bedrock-kb-source-uri")
            if s3_uri and s3_uri.startswith("s3://"):
                bucket_name, key = s3_uri.replace("s3://", "").split("/", 1)
                presigned_url = generate_presigned_url(bucket_name, key)
                metadata['presigned_url'] = presigned_url

            content = reference.get("content", {}).get("text", None)
            metadata_content_pairs.append({"metadata": metadata, "chunk_content": content})

    return {
        "session_id": session_id,
        "agent_response": response,
        "metadata_content_pairs": metadata_content_pairs
    }

def rag_response(query: str, session_id: str):
    """Get the RAG response for a query."""
    response, trace_data, session_id = simple_agent_invoke(query, agent_id, agent_alias_id, session_id=session_id)
    return extract_metadata_with_content_tabular(trace_data, response, session_id)

# API Endpoints
@rag_router.post("/api/new-session")
async def create_session_route(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.id

    session_id = create_new_session(user_id, db)
    return {"session_id": session_id}


@rag_router.post("/api/session")
async def create_session_route(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.id

    existing_session = db.query(RagSession).filter(RagSession.user_id == user_id).order_by(RagSession.last_access_time.desc()).first()
    if existing_session:
        existing_session.last_access_time = datetime.utcnow()
        db.commit()

    session_id = create_new_session(user_id, db)
    return {"session_id": session_id}

@rag_router.get("/api/rag-search")
async def get_rag_answer(
    query: str = Query(..., description="User query"),
    session_id: str = Query(..., description="Active session ID"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id

    session = db.query(RagSession).filter(RagSession.session_id == session_id, RagSession.user_id == user_id).first()
    if not session:
        logerror(f"Session {session_id} does not belong to user {user_id}.")
        raise HTTPException(status_code=403, detail="Session does not belong to this user or does not exist.")

    result = rag_response(query, session_id)

    session_data = session.data
    session_data.setdefault("history", []).append({
        "user": query,
        "response": result["agent_response"],
        "metadata_content_pairs": result["metadata_content_pairs"]
    })

    session.last_access_time = datetime.utcnow()
    session.data = session_data
    db.commit()

    save_session_to_db(session_id, user_id, session_data, db)

    return {
        "session_id": session_id,
        "agent_response": result["agent_response"],
        "metadata_content_pairs": result["metadata_content_pairs"]
    }

@rag_router.get("/api/session/verify")
async def verify_session(
    session_id: str = Query(None, description="Session ID to verify"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id

    if not session_id:
        new_session_id = create_new_session(user_id, db)
        return {"session_id": new_session_id, "status": "new_session_created"}

    try:
        validate_and_refresh_session(session_id, user_id, db)
        return {"session_id": session_id, "status": "session_valid"}
    except HTTPException as e:
        if e.status_code in [401, 403]:
            new_session_id = create_new_session(user_id, db)
            return {"session_id": new_session_id, "status": "new_session_created"}
        raise

@rag_router.get("/api/user-sessions")
async def get_user_sessions(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id

    sessions = (
        db.query(RagSession)
        .filter(RagSession.user_id == user_id)
        .order_by(RagSession.last_access_time.desc())
        .all()
    )

    result = []
    for session in sessions:
        session_data = session.data
        history = session_data.get("history", [])
        first_query = history[0]["user"] if history else None
        result.append({
            "session_id": str(session.session_id),
            "first_query": first_query,
            "last_access_time": session.last_access_time.isoformat(),
        })

    return {"user_id": str(user_id), "sessions": result}

@rag_router.post("/api/session/set-active")
async def set_active_session(
    session_id: str = Query(..., description="Session ID to set active"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id

    session = db.query(RagSession).filter(RagSession.session_id == session_id, RagSession.user_id == user_id).first()
    if not session:
        logerror(f"Session {session_id} does not belong to user {user_id}.")
        raise HTTPException(status_code=403, detail="Session does not belong to this user or does not exist.")

    history = session.data.get("history", [])
    formatted_history = [
        {
            "query": entry.get("user"),
            "response": {
                "agent_response": entry.get("response"),
                "metadata_content_pairs": entry.get("metadata_content_pairs", [])
            }
        }
        for entry in history
    ]

    return {
        "session_id": session_id,
        "status": "active_session_set",
        "history": formatted_history
    }
