import json
import uuid
import boto3
from common_logging import loginfo, logerror
from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Union
from dotenv import load_dotenv

load_dotenv()

# Initialize the router
rag_router = APIRouter()

# Initialize boto3 clients
region = boto3.session.Session().region_name
if not region:
    region = "us-east-1"  # Fallback to default region if not set

bedrock_agent_runtime_client = boto3.client('bedrock-agent-runtime', region_name=region)
s3_client = boto3.client('s3')

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


def generate_presigned_url(bucket_name, key, expiration=3600):
    """
    Generate a presigned URL for accessing a file in S3.
    :param bucket_name: Name of the S3 bucket.
    :param key: Key (file path) of the object in S3.
    :param expiration: Time in seconds for the URL to remain valid.
    :return: Presigned URL string.
    """
    try:
        url = s3_client.generate_presigned_url('get_object',
                                               Params={'Bucket': bucket_name, 'Key': key},
                                               ExpiresIn=expiration)
        return url
    except Exception as e:
        logerror(f"Error generating presigned URL: {e}")
        return None


def simple_agent_invoke(input_text: str, agent_id: str, agent_alias_id: str, session_id: str = session_id,
                        enable_trace: bool = True, end_session: bool = False) -> str:
    """ Invoke the agent with the given input text and return the response """
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
    """
    Extracts metadata and content from traces and formats them in tabular JSON format.
    Includes presigned URLs for S3 resources.
    """
    metadata_content_pairs = []

    for trace in trace_data:
        orchestration_trace = trace.get("trace", {}).get("orchestrationTrace", {})
        observation = orchestration_trace.get("observation", {})
        retrieved_references = observation.get("knowledgeBaseLookupOutput", {}).get("retrievedReferences", [])
        
        for reference in retrieved_references:
            metadata = reference.get("metadata", {})
            s3_uri = metadata.get("x-amz-bedrock-kb-source-uri")

            # Generate presigned URL if S3 URI exists
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


def rag_response(query: str) -> Dict[str, Union[str, List[dict]]]:
    """
    Perform Retrieval-Augmented Generation (RAG) and include presigned URLs in the response.
    """
    try:
        # Invoke the agent
        response, trace_data, session_id = simple_agent_invoke(query, agent_id, agent_alias_id)
        # Extract metadata and add presigned URLs
        result = extract_metadata_with_content_tabular(trace_data, response, session_id)
        return result
    except Exception as e:
        logerror(f"Error in RAG search: {e}")
        raise HTTPException(status_code=500, detail="Failed to process RAG response")


@rag_router.get("/api/rag-search", response_model=Dict[str, Union[str, List[dict]]])
async def get_rag_answer(query: str = Query(..., description="User query")):
    """
    API Endpoint to perform a RAG search.
    """
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required.")
    result = rag_response(query)
    return result
