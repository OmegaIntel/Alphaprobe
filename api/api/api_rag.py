import csv
import json
import uuid
import boto3


from common_logging import loginfo, logerror
from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict
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

# Function to invoke the agent
def simple_agent_invoke(input_text: str, agent_id: str, agent_alias_id: str, session_id: str = None,
                        enable_trace: bool = False, end_session: bool = True)-> str:
    """ Invoke the agent with the given input text and return the response """

    if session_id is None:
        session_id = str(uuid.uuid1())
    
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
        event_stream = agent_response['completion']
        for event in event_stream:
            if 'chunk' in event:
                data = event['chunk']['bytes']
                decoded_data = data.decode('utf8')
                loginfo(f"Chunk data received: {decoded_data}")
                agent_answer += decoded_data
            elif 'trace' in event:
                loginfo("Trace data:")
                loginfo(json.dumps(event['trace'], indent=2))
            else:
                logerror("Unexpected event received:")

        return agent_answer

    except Exception as e:
        logerror(f"Error invoking agent: {e}")
        raise
    
    return agent_answer

# Define the RAG search function
def rag_response(query: str) -> Dict[str, List[str]]:
    """ Perform RAG search with the given query """
    # Invoke the agent with the user query
    response = simple_agent_invoke(query, agent_id, agent_alias_id)
    response_dict = {'response': response}
    return response_dict



# Define the rag search API endpoint
@rag_router.get("/api/rag-search", response_model=List[dict[str, str]])
async def get_rag_answer(query: str = Query(..., description="User query")):
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required.")
    
    # Perform rag with user query
    result = rag_response(query)
    return result
