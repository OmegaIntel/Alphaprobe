import json
import boto3
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List
from dotenv import load_dotenv
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
import uuid

# Load environment variables
load_dotenv()


# Initialize the router
knowledgebase_rag_router = APIRouter()

# AWS Configuration
REGION = "us-east-1"

STATISTA_KB_ID = "EKIBCTUKSJ"  # Original knowledge base ID for Statista
BCC_KB_ID = "D89CVFCL1X"       # Second knowledge base ID for BCC
DUN_AND_BRADSTREET_KB_ID = "EWVPPGHWGO"  # Third knowledge base ID for Dun_and_Bradstreet
PLUNKETT_RESEARCH_KB_ID = "MPXVA26KMK"  # Fourth knowledge base ID for Plunkett_Research

# AWS Clients
bedrock_agent_client = boto3.client("bedrock-agent-runtime", region_name=REGION)
bedrock_runtime_client = boto3.client("bedrock-runtime", region_name=REGION)

# Constants
MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0"
MAX_TOKENS = 500

def retrieve_from_knowledge_base(kb_id: str, query: str, number_of_results: int) -> List[Dict[str, Any]]:
    """
    Retrieve relevant chunks from a single knowledge base using vector search.
    """
    payload = {
        "retrievalQuery": {"text": query},
        "retrievalConfiguration": {
            "vectorSearchConfiguration": {"numberOfResults": number_of_results}
        }
    }

    try:
        response = bedrock_agent_client.retrieve(
            knowledgeBaseId=kb_id,
            retrievalConfiguration=payload["retrievalConfiguration"],
            retrievalQuery=payload["retrievalQuery"]
        )
        return response.get("retrievalResults", [])
    except boto3.exceptions.Boto3Error as e:
        raise HTTPException(status_code=500, detail=f"Retrieval API call failed for knowledge base {kb_id}: {e}")




# Updated hybrid_search function to include all four knowledge bases
def hybrid_search(query: str, number_of_results: int = 5) -> List[Dict[str, Any]]:
    """
    Perform vector search across multiple knowledge bases in parallel.
    Then filter the results by keyword matching to simulate hybrid search.
    """
    # Include all four knowledge bases
    knowledge_base_ids = [
        STATISTA_KB_ID,
        BCC_KB_ID,
        DUN_AND_BRADSTREET_KB_ID,
        PLUNKETT_RESEARCH_KB_ID
    ]
    results = []

    with ThreadPoolExecutor() as executor:
        futures = [executor.submit(retrieve_from_knowledge_base, kb_id, query, number_of_results) for kb_id in knowledge_base_ids]
        
        for future in as_completed(futures):
            try:
                results.extend(future.result())
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error during retrieval: {e}")

    # Simulate keyword search by filtering results containing query keywords
    keywords = set(query.lower().split())
    
    filtered_results = [
        result for result in results
        if any(keyword in result["content"]["text"].lower() for keyword in keywords)
    ]

    # Deduplicate results based on content
    seen = set()
    unique_results = []
    for result in filtered_results:
        content = result["content"]["text"]
        
        if content not in seen:
            seen.add(content)
            unique_results.append(result)

    # Sort results by score (assuming each result has a 'score' field)
    sorted_results = sorted(unique_results, key=lambda x: x.get("score", 0), reverse=True)

    return sorted_results[:number_of_results]


def generate_financial_insight(context: str, question: str) -> str:
    """
    Generate a concise, statistics-focused analysis using AWS Bedrock Claude-3.5 Messages API.
    """
    prompt = (
        f"deliver a concise, structured comparison focusing on key statistics, insights, and patterns. "
        f"Present the information clearly in complete sentences without line breaks.\n\n"
        f"Context:\n{context}\n\n"
        f"Question:\n{question}\n\n"
        f"Instructions:\n"
        "- **Investment Plans**: Compare the investment intentions of the key entities or sectors involved.\n"
        "- **Business Sentiment**: Summarize the sentiment of different entities or sectors, including notable statistics.\n"
        "- **Market Share Trends**: Highlight changes in market share over time for the relevant entities or sectors.\n"
        "- **Competitive Advantages**: Identify key factors contributing to the competitive advantages of different entities or sectors.\n"
        "- **Summary**: Provide a brief overall performance comparison and outlook for the next 6 months.\n\n"
        "Ensure the response is concise, using bullet points or short paragraphs, and focus on key statistics, percentages, and clear patterns."
    )
    messages = []

    # Add the initial user message with the system instructions
    messages.append({
        "role": "assistant",
        "content": (
            "Instructions: You are an AI assistant with access to a database of research reports from multiple providers. "
            "Your task is to provide clear, accurate, and concise answers to user questions based on the information "
            "in the reports. If relevant, include specific details such as numbers, names, or statistics from the reports. "
    
        )
    })

    # Add the user message
    messages.append({"role": "user", "content": prompt})
    payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "messages": messages,
            "max_tokens": MAX_TOKENS,
        }

    try:
        response = bedrock_runtime_client.invoke_model(
            body=json.dumps(payload),
            modelId=MODEL_ID,
            accept="application/json",
            contentType="application/json"
        )
        response_body = response["body"].read().decode("utf-8")
        content = json.loads(response_body).get("content", "No response generated.")
        return content
    except boto3.exceptions.Boto3Error as e:
        raise HTTPException(status_code=500, detail=f"Model invocation failed: {e}")

# @knowledgebase_rag_router.get("/api/rag-search_v1", response_model=Dict[str, Any])
# async def rag_pipeline(query: str = Query(..., description="User query")):
#     """
#     Perform hybrid search and generate a concise response using AWS Bedrock Claude-3.5.
#     """
#     if not query:
#         raise HTTPException(status_code=400, detail="Query parameter is required.")

#     try:
#         # Step 1: Perform hybrid search on both knowledge bases
#         retrieval_results = hybrid_search(query, 5)
        
#         if not retrieval_results:
#             raise HTTPException(status_code=404, detail="No relevant results found in the knowledge bases.")

#         # Extract text content from retrieved chunks
#         context_list = [result["content"]["text"] for result in retrieval_results]
#         context = "\n\n".join(context_list)

#         # Step 2: Generate a concise response using the retrieved context and user query
#         llm_response = generate_financial_insight(context, query)

#         # Extract text from the response if it is a list with a dictionary containing 'text'
#         if isinstance(llm_response, list) and len(llm_response) > 0 and 'text' in llm_response[0]:
#             llm_response_text = llm_response[0]['text']
#         else:
#             llm_response_text = str(llm_response)  # Fallback to string conversion if format is unexpected

#         # Step 3: Format the response to match the desired structure
#         formatted_response = {
#             "session_id": str(uuid.uuid1()),  # Generate a unique session ID
#             "agent_response": llm_response_text,    # Ensure this is a plain string
#             "metadata_content_pairs": [
#                 {
#                     "metadata": {
#                         "x-amz-bedrock-kb-source-uri": result["metadata"]["x-amz-bedrock-kb-source-uri"],
#                         "x-amz-bedrock-kb-document-page-number": result["metadata"]["x-amz-bedrock-kb-document-page-number"],
#                         "x-amz-bedrock-kb-chunk-id": result["metadata"]["x-amz-bedrock-kb-chunk-id"],
#                         "x-amz-bedrock-kb-data-source-id": result["metadata"]["x-amz-bedrock-kb-data-source-id"]
#                     },
#                     "chunk_content": result["content"]["text"]
#                 }
#                 for result in retrieval_results
#             ]
#         }

#         return formatted_response

#     except HTTPException as e:
#         raise e
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error processing RAG pipeline: {e}")
def generate_presigned_url(s3_uri: str, expiration: int = 3600) -> str:
    """
    Generate a presigned URL for accessing an S3 object.
    """
    s3_client = boto3.client("s3")

    # Parse the S3 bucket and key from the URI
    s3_prefix = "s3://"
    if not s3_uri.startswith(s3_prefix):
        raise ValueError("Invalid S3 URI format")

    s3_path = s3_uri[len(s3_prefix):]
    bucket_name, key = s3_path.split("/", 1)

    try:
        presigned_url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket_name, "Key": key},
            ExpiresIn=expiration
        )
        return presigned_url
    except boto3.exceptions.Boto3Error as e:
        raise HTTPException(status_code=500, detail=f"Error generating presigned URL: {e}")


@knowledgebase_rag_router.get("/api/rag-search_v1", response_model=Dict[str, Any])
async def rag_pipeline(query: str = Query(..., description="User query")):
    """
    Perform hybrid search and generate a concise response using AWS Bedrock Claude-3.5.
    """
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required.")

    try:
        # Step 1: Perform hybrid search on both knowledge bases
        retrieval_results = hybrid_search(query, 5)
        
        if not retrieval_results:
            raise HTTPException(status_code=404, detail="No relevant results found in the knowledge bases.")

        # Extract text content from retrieved chunks
        context_list = [result["content"]["text"] for result in retrieval_results]
        context = "\n\n".join(context_list)

        # Step 2: Generate a concise response using the retrieved context and user query
        llm_response = generate_financial_insight(context, query)

        # Extract text from the response
        if isinstance(llm_response, list) and len(llm_response) > 0 and 'text' in llm_response[0]:
            llm_response_text = llm_response[0]['text']
        else:
            llm_response_text = str(llm_response)

        # Step 3: Format the response with presigned URLs
        formatted_response = {
            "session_id": str(uuid.uuid1()),
            "agent_response": llm_response_text,
            "metadata_content_pairs": [
                {
                    "metadata": {
                        "x-amz-bedrock-kb-source-uri": result["metadata"]["x-amz-bedrock-kb-source-uri"],
                        "x-amz-bedrock-kb-document-page-number": result["metadata"]["x-amz-bedrock-kb-document-page-number"],
                        "x-amz-bedrock-kb-chunk-id": result["metadata"]["x-amz-bedrock-kb-chunk-id"],
                        "x-amz-bedrock-kb-data-source-id": result["metadata"]["x-amz-bedrock-kb-data-source-id"],
                        "pre_assigned_url": generate_presigned_url(result["metadata"]["x-amz-bedrock-kb-source-uri"])
                    },
                    "chunk_content": result["content"]["text"]
                }
                for result in retrieval_results
            ]
        }

        return formatted_response

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing RAG pipeline: {e}")
