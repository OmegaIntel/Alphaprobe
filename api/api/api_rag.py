import uuid
import boto3
from common_logging import loginfo, logerror
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Dict, Union
from datetime import datetime, timedelta
from pydantic import BaseModel
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from api.api_user import get_current_user , User, SECRET_KEY, ALGORITHM
import json
import os

rag_router = APIRouter()

region = boto3.session.Session().region_name
if not region:
    region = "us-east-1"

bedrock_agent_runtime_client = boto3.client('bedrock-agent-runtime', region_name=region)
s3_client = boto3.client('s3')

agent_id = "IGC1V40HTU"
agent_alias_id = "CEFQBNZFIC"

# File where sessions are stored
SESSION_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'sessions.json')
print("SESSION_FILE path:", SESSION_FILE)

SESSION_TIMEOUT = timedelta(minutes=5)
sessions = {}  # in-memory store

def load_sessions():
    """Load sessions from the JSON file if it exists."""
    if os.path.exists(SESSION_FILE):
        try:
            with open(SESSION_FILE, 'r') as f:
                data = json.load(f)
            # Convert last_access_time strings back to datetime objects
            for sid, sdata in data.items():
                sdata["last_access_time"] = datetime.fromisoformat(sdata["last_access_time"])
            loginfo("Sessions loaded successfully from file.")
            return data
        except Exception as e:
            logerror(f"Error loading sessions: {e}")
            return {}
    else:
        loginfo("No existing sessions file found.")
    return {}

def save_sessions():
    """Save the current sessions to a JSON file."""
    try:
        # Convert datetime objects to ISO format for JSON serialization
        data_to_save = {}
        for sid, sdata in sessions.items():
            data_copy = dict(sdata)
            data_copy["last_access_time"] = data_copy["last_access_time"].isoformat()
            data_to_save[sid] = data_copy

        os.makedirs(os.path.dirname(SESSION_FILE), exist_ok=True)
        with open(SESSION_FILE, 'w') as f:
            json.dump(data_to_save, f, indent=4)
        loginfo("Sessions saved successfully.")
    except Exception as e:
        logerror(f"Error saving sessions: {e}")

# Load sessions at startup
sessions = load_sessions()

def decode_bytes(obj):
    if isinstance(obj, dict):
        return {k: decode_bytes(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [decode_bytes(v) for v in obj]
    if isinstance(obj, bytes):
        return obj.decode('utf8')
    return obj

def generate_presigned_url(bucket_name, key, expiration=3600):
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
                        enable_trace: bool = True, end_session: bool = False) -> str:
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
    try:
        response, trace_data, session_id = simple_agent_invoke(query, agent_id, agent_alias_id, session_id=session_id)
        result = extract_metadata_with_content_tabular(trace_data, response, session_id)
        return result
    except Exception as e:
        logerror(f"Error in RAG search: {e}")
        raise HTTPException(status_code=500, detail="Failed to process RAG response")

def validate_and_refresh_session(session_id: str, user_id: str):
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session_id.")
    if session["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Session does not belong to this user.")

    now = datetime.utcnow()
    if now - session["last_access_time"] > SESSION_TIMEOUT:
        sessions.pop(session_id, None)
        save_sessions()
        raise HTTPException(status_code=401, detail="Session expired.")

    session["last_access_time"] = now
    save_sessions()

def create_new_session(user_id: str) -> str:
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "user_id": user_id,
        "last_access_time": datetime.utcnow(),
        "data": {}
    }
    save_sessions()
    return session_id

@rag_router.post("/api/session")
async def create_session_route(current_user = Depends(get_current_user)):
    user_id = current_user.id
    session_id = create_new_session(user_id)
    return {"session_id": session_id}

@rag_router.get("/api/rag-search")
async def get_rag_answer(
    query: str = Query(..., description="User query"),
    session_id: str = Query(..., description="Session ID"),
    current_user = Depends(get_current_user)
):
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required.")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id parameter is required.")

    validate_and_refresh_session(session_id, current_user.id)
    result = rag_response(query, session_id)

    # Update the session data
    sessions[session_id]["data"].setdefault("history", []).append({
        "user": query,
        "response": result["agent_response"],
        "metadata_content_pairs": result["metadata_content_pairs"]
    })
    save_sessions()
    return result

@rag_router.get("/api/session/verify")
async def verify_session(
    session_id: str = Query(None, description="Session ID to verify"),
    current_user = Depends(get_current_user)
):
    user_id = current_user.id

    # If no session_id provided, just create a new one.
    if not session_id:
        new_session_id = create_new_session(user_id)
        return {"session_id": new_session_id, "status": "new_session_created"}

    # Check if session is valid
    try:
        validate_and_refresh_session(session_id, user_id)
        # If valid, return the same session_id
        return {"session_id": session_id, "status": "session_valid"}
    except HTTPException as e:
        # If invalid or expired, create a new session
        if e.status_code in [401, 403]:
            new_session_id = create_new_session(user_id)
            return {"session_id": new_session_id, "status": "new_session_created"}
        raise
