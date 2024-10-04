import os
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File
from db_models.weaviatedb import WeaviateManager
import boto3
from botocore.exceptions import NoCredentialsError
from pydantic import BaseModel
from llm_models.llm import LLM

temp_chat_router = APIRouter()

weaviate = WeaviateManager()
llm_wrapper = LLM()

# S3 configurations
S3_BUCKET = os.environ["S3_BUCKET"]
S3_REGION = os.environ["S3_REGION"]
S3_ACCESS_KEY = os.environ["S3_ACCESS_KEY"]
S3_SECRET_KEY = os.environ["S3_SECRET_KEY"]


# Define the request and response models
class ChatRequest(BaseModel):
    query: str  # User's message
    chat_id: str  # The document context ID

class ChatResponse(BaseModel):
    response: str

# Create an S3 client
s3 = boto3.client(
    "s3",
    aws_access_key_id=S3_ACCESS_KEY,
    aws_secret_access_key=S3_SECRET_KEY,
    region_name=S3_REGION
)

@temp_chat_router.post("/api/temporary/upload")
async def upload_file(file: UploadFile = File(...)):
    # Generate a UUID for the document
    document_uuid = str(uuid.uuid4()).replace("-", "")
    
    # Sanitize the file name
    original_filename = file.filename
    sanitized_filename = "temp_" + document_uuid + "_" + original_filename.replace(" ", "_").replace("/", "_").replace("\\", "_")
    
    try:
        # Upload the file to S3
        s3.upload_fileobj(
            file.file,  # File object
            S3_BUCKET,  # S3 bucket name
            sanitized_filename  # S3 file path
        )
    except NoCredentialsError:
        raise HTTPException(status_code=500, detail="S3 credentials not available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload to S3 failed: {str(e)}")

    try:
        # Generate a presigned URL for the uploaded file
        presigned_url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET, 'Key': sanitized_filename},
            ExpiresIn=3600  # URL expiration time in seconds (1 hour)
        )

        # Use "temp" collection name (or customize as needed)
        collection_name = "temp_" + document_uuid

        # Add the document to Weaviate with the UUID and presigned URL
        weaviate.create_collection(collection_name, document_uuid, presigned_url)

        print(presigned_url, "test", sanitized_filename)

        s3.delete_object(Bucket=S3_BUCKET, Key=sanitized_filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding file to Weaviate: {str(e)}")

    return {
        "message": "File uploaded successfully added to Weaviate",
        "chat_id": collection_name
    }

@temp_chat_router.post("/api/temporary/chat", response_model=ChatResponse)
async def chat_using_document(request: ChatRequest):
    # Fetch the document context from Weaviate based on context_id
    document_context = weaviate.retrieve_content(request.query,request.chat_id)
    
    if not document_context:
        raise HTTPException(status_code=404, detail="Document context not found")
    
    # User message from the request
    user_message = request.query
    
    # Generate the AI response using the document context and user message
    ai_response = llm_wrapper.generate_response(user_message, document_context)

    return ChatResponse(response=ai_response)

@temp_chat_router.post("/api/temporary/chat/end", response_model=None)
async def end_chat(chat_id: str):
    deleted_obj = weaviate.delete_context(chat_id)

    return {"message": deleted_obj}