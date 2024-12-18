from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List
import json
import boto3
from dotenv import load_dotenv
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI

# Load environment variables
load_dotenv()

# Initialize the router
query_classifier_knowledgebase_rag_router = APIRouter()

# AWS Configuration
REGION = "us-east-1"
MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0"

# Knowledge Base IDs
STATISTA_KB_ID = "EKIBCTUKSJ"          # Statista
BCC_KB_ID = "D89CVFCL1X"               # BCC
DUN_AND_BRADSTREET_KB_ID = "EWVPPGHWGO"  # Dun_and_Bradstreet
PLUNKETT_RESEARCH_KB_ID = "MPXVA26KMK"   # Plunkett_Research

# AWS Clients
bedrock_agent_client = boto3.client("bedrock-agent-runtime", region_name=REGION)
bedrock_runtime_client = boto3.client("bedrock-runtime", region_name=REGION)

class QueryClassifier:
    def __init__(self):
        self.llm = ChatOpenAI(temperature=0, model_name="gpt-4o-mini", max_tokens=500)
        self.prompt = PromptTemplate(
            input_variables=["query"],
            template="""
You are tasked with classifying a query into one of the following four categories:
- **Factual**: A query that requests concrete, objective, and verifiable information. Example: "What is the capital of France?"
- **Analytical**: A query that involves examining, evaluating, or comparing data to form conclusions. Example: "How has the stock market performed compared to bond yields over the last year?"
- **Opinion**: A query that seeks personal viewpoints, beliefs, or judgments. Example: "What do you think is the best programming language for beginners?"
- **Contextual**: A query that depends on understanding specific background information, context, or circumstances. Example: "How can I optimize my investments given the current economic conditions?"

Classify the following query based on the definitions above and respond with only the category name.

Query: {query}

Category:"""
        )
        self.chain = self.prompt | self.llm

    def classify(self, query):
        print("Classifying query...")
        response = self.chain.invoke(query)
        category = response.content.strip().split('\n')[0].strip()
        print(f"Query Category: {category}")
        return category

# Initialize the Query Classifier
query_classifier = QueryClassifier()

def get_params_by_category(category: str) -> Dict[str, int]:
    """Set max_tokens and number_of_results based on query category."""
    category = category.capitalize()
    params = {
        "Factual": {"max_tokens": 400, "number_of_results": 5},
        "Analytical": {"max_tokens": 500, "number_of_results": 7},
        "Opinion": {"max_tokens": 500, "number_of_results": 5},
        "Contextual": {"max_tokens": 600, "number_of_results": 6}
    }
    return params.get(category, {"max_tokens": 300, "number_of_results": 3})

def retrieve_from_knowledge_base(kb_id: str, query: str, number_of_results: int) -> List[Dict[str, Any]]:
    """Retrieve relevant chunks from a single AWS Knowledge Base using the Retrieve API."""
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

def retrieve_from_knowledge_bases(query: str, number_of_results: int) -> List[Dict[str, Any]]:
    """Retrieve relevant chunks from multiple AWS Knowledge Bases using the Retrieve API in parallel."""
    knowledge_base_ids = [
        STATISTA_KB_ID,
        BCC_KB_ID,
        DUN_AND_BRADSTREET_KB_ID,
        PLUNKETT_RESEARCH_KB_ID
    ]
    results = []

    with ThreadPoolExecutor() as executor:
        futures = [
            executor.submit(retrieve_from_knowledge_base, kb_id, query, number_of_results)
            for kb_id in knowledge_base_ids
        ]
        
        for future in as_completed(futures):
            try:
                results.extend(future.result())
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error during retrieval: {e}")

    # Deduplicate results based on content
    seen = set()
    unique_results = []
    for result in results:
        content = result["content"]["text"]
        if content not in seen:
            seen.add(content)
            unique_results.append(result)

    return unique_results[:number_of_results]
def invoke_model(prompt: str, max_tokens: int) -> str:
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
        "max_tokens": max_tokens,
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

@query_classifier_knowledgebase_rag_router.get("/api/rag-search_v2", response_model=Dict[str, Any])
async def rag_pipeline(query: str = Query(..., description="User query")):
    """
    Perform hybrid search and generate a concise response using the query classification.
    """
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required.")

    try:
        # Step 1: Classify the query and get parameters based on the category
        category = query_classifier.classify(query)
        params = get_params_by_category(category)

        # Step 2: Retrieve relevant chunks from multiple knowledge bases
        retrieval_results = retrieve_from_knowledge_bases(query, params["number_of_results"])

        if not retrieval_results:
            raise HTTPException(status_code=404, detail="No relevant results found in the knowledge bases.")

        # Extract text content from retrieved chunks
        context_list = [result["content"]["text"] for result in retrieval_results]
        context = "\n\n".join(context_list)

        # Step 3: Generate a concise response using the retrieved context and user query
        llm_response = invoke_model(context, params["max_tokens"])

        # Extract text from the response if it is a list with a dictionary containing 'text'
        if isinstance(llm_response, list) and len(llm_response) > 0 and 'text' in llm_response[0]:
            llm_response_text = llm_response[0]['text']
        else:
            llm_response_text = str(llm_response)  # Fallback to string conversion if format is unexpected

        # Step 4: Format the response to match the desired structure
        formatted_response = {
            "session_id": str(uuid.uuid1()),  # Generate a unique session ID
            "agent_response": llm_response_text,  # Ensure this is a plain string
            "metadata_content_pairs": [
                {
                    "metadata": {
                        "x-amz-bedrock-kb-source-uri": result["metadata"].get("x-amz-bedrock-kb-source-uri"),
                        "x-amz-bedrock-kb-document-page-number": result["metadata"].get("x-amz-bedrock-kb-document-page-number"),
                        "x-amz-bedrock-kb-chunk-id": result["metadata"].get("x-amz-bedrock-kb-chunk-id"),
                        "x-amz-bedrock-kb-data-source-id": result["metadata"].get("x-amz-bedrock-kb-data-source-id")
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
