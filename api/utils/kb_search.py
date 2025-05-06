import os
import boto3
import botocore
from typing import Dict, Any
from dotenv import load_dotenv, find_dotenv
from utils.aws_utils import AwsUtlis

env_path = find_dotenv()  # walks up until it finds .env
loaded = load_dotenv(env_path)

# =============================================================================
# ENV / AWS CONFIG
# =============================================================================
s3_client = AwsUtlis.get_s3_client()

bedrock_client = AwsUtlis.get_bedrock_agent()

bedrock_runtime = AwsUtlis.get_bedrock_agent_runtime()

# =============================================================================
# BEDROCK / KB (Re-added as per original)
# =============================================================================

generationPrompt = """
You are an intelligent assistant tasked with organizing and prioritizing search results for a user query. 
Analyze the following search results and rank them based on relevance to the user's question. 
If any results are irrelevant or redundant, exclude them.

User Query: $query$

Search Results:
$search_results$

Instructions:
1. Rank the search results by relevance to the user's query.
2. Remove any duplicate or irrelevant results.
3. Summarize the key points from the top results.

current time $current_time$

Output the organized and prioritized results in a structured format."""

orchestrationPrompt = """
You are a knowledgeable assistant with access to a comprehensive knowledge base. 
Use the following organized search results to answer the user's question. 
If the search results do not contain enough information, say "I don't know."

User Query: $query$

Instructions:
1. Provide a clear and concise answer to the user's question.
2. Use only the information from the search results.
3. If the search results are insufficient, say "I don't know."
4. Format the response in a professional and easy-to-read manner.

Underlying instructions for formatting the response generation and citations. $output_format_instructions$

Here is the conversation history $conversation_history$

current time - $current_time$

Answer:"""


def get_presigned_url_from_source_uri(source_uri: str, expiration: int = 3600) -> str:
    if not source_uri.startswith("s3://"):
        return source_uri
    without_prefix = source_uri.replace("s3://", "")
    parts = without_prefix.split("/", 1)
    if len(parts) != 2:
        return source_uri
    bucket, key = parts
    try:
        url = s3_client.generate_presigned_url(
            "get_object", Params={"Bucket": bucket, "Key": key}, ExpiresIn=expiration
        )
        return url
    except Exception as e:
        print(f"[DEBUG] Error generating presigned URL: {e}")
        return source_uri


def query_kb(
    input_text: str, kb_id: str, user_id: str, project_id: str, model_arn: str
) -> Dict[str, Any]:
    print(f"[DEBUG] query_kb with text={input_text}")
    vector_search_config = {"numberOfResults": 5}
    filters = []
    if user_id:
        filters.append({"equals": {"key": "user_id", "value": str(user_id)}})
    if project_id and project_id != "none":
        filters.append({"equals": {"key": "project_id", "value": project_id}})
    if filters:
        if len(filters) == 1:
            vector_search_config["filter"] = filters[0]
        else:
            vector_search_config["filter"] = {"andAll": filters}
    try:
        resp = bedrock_runtime.retrieve_and_generate(
            input={"text": input_text},
            retrieveAndGenerateConfiguration={
                "knowledgeBaseConfiguration": {
                    "generationConfiguration": {
                        "promptTemplate": {"textPromptTemplate": generationPrompt}
                    },
                    "orchestrationConfiguration": {
                        "queryTransformationConfiguration": {
                            "type": "QUERY_DECOMPOSITION"
                        }
                    },
                    "knowledgeBaseId": kb_id,
                    "modelArn": model_arn,
                    "retrievalConfiguration": {
                        "vectorSearchConfiguration": vector_search_config
                    },
                },
                "type": "KNOWLEDGE_BASE",
            },
        )
        return resp
    except botocore.exceptions.ClientError as e:
        print(f"[DEBUG] query_kb() client error: {e}")
        return {}
