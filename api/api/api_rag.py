import json
import uuid
import boto3
from common_logging import loginfo, logerror
from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Union
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()


# Initialize the router
rag_router = APIRouter()
# Initialize boto3 clients
region = boto3.session.Session().region_name
if not region:
    region = "us-east-1"  # Fallback to default region if not set


bedrock_agent_runtime_client = boto3.client('bedrock-agent-runtime', region_name=region)


# Define agent alias and ID
agent_id = "IGC1V40HTU"  # Replace with your actual agent ID
agent_alias_id = "TMRHXE0UZR"


session_id = str(uuid.uuid1())

def decode_bytes(obj):
    """
    Recursively decode bytes in a dictionary or list to ensure it is JSON serializable.
    """
    if isinstance(obj, dict):
        return {k: decode_bytes(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [decode_bytes(v) for v in obj]
    if isinstance(obj, bytes):
        return obj.decode('utf8')
    return obj


# Function to invoke the agent

def simple_agent_invoke(input_text: str, agent_id: str, agent_alias_id: str, session_id: str = session_id,
                        enable_trace: bool = True, end_session: bool = False)-> str:
    """ Invoke the agent with the given input text and return the response """
    
    
    traces = []
    agent_answer = ''
    try:
        # Invoke the agent
        agent_response = bedrock_agent_runtime_client.invoke_agent(
            inputText=input_text,
            agentId=agent_id,
            agentAliasId=agent_alias_id,
            sessionId=session_id,
            enableTrace=enable_trace,
            endSession=end_session
        )
        loginfo(f"Agent response: {agent_response}")
        
        # Process the response
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
    

# Extract Metadata from Agent Response
def extract_metadata_with_content_tabular(trace_data, response, session_id):
    """
    Extracts metadata and content from traces and formats them in tabular JSON format.
    """
    metadata_content_pairs = []

    for trace in trace_data:
        orchestration_trace = trace.get("trace", {}).get("orchestrationTrace", {})
        observation = orchestration_trace.get("observation", {})
        retrieved_references = observation.get("knowledgeBaseLookupOutput", {}).get("retrievedReferences", [])
        
        for reference in retrieved_references:
            metadata = reference.get("metadata", {})
            content = reference.get("content", {}).get("text", None)
            metadata_content_pairs.append({"metadata": metadata, "chunk_content": content})

    return {
        "session_id": session_id,
        "agent_response": response,
        "metadata_content_pairs": metadata_content_pairs
    }



# Define the RAG search function
def rag_response(query: str) -> Dict[str, Union[str, List[dict]]]:
    
    try:
        # Invoke the agent with the user query
        response, trace_data, session_id = simple_agent_invoke(query, agent_id, agent_alias_id)
        # Extract metadata and prepare tabular data
        result = extract_metadata_with_content_tabular(trace_data, response, session_id)
        # Return the result as JSON
        return result
    except Exception as e:
        logerror(f"Error in RAG search: {e}")
        raise HTTPException(status_code=500, detail="Failed to process RAG response")
    



# Define the rag search API endpoint
@rag_router.get("/api/rag-search", response_model=Dict[str, Union[str, List[dict]]])
async def get_rag_answer(query: str = Query(..., description="User query")):
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required.")
    
    # Perform rag with user query
    result = rag_response(query)
    return result
