from fastapi import APIRouter, UploadFile, File, Form
from api.models.chat.chat_request import ChatRequest
from api.models.chat.chat_response import ChatResponse
from api.models.files.upload_reponse import UploadResponse
from api.llm_models.llm import LLM
from typing import Literal
import os

from api.db_models.weaviate_db import WeaviateDb

router = APIRouter()

latent_db = WeaviateDb()
llm = LLM()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    user_message = request.message
    # Here you would integrate your chat logic. For example, using an AI model.
    # For demonstration purposes, we'll echo back the user's message.
    ai_response = f"Echo: {user_message}"
    return ChatResponse(response=ai_response)

@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    company: str = Form(...),
    file_type: Literal["descriptive", "financial"] = Form(...),
    file: UploadFile = File(...)
):
    # Define the file storage location
    file_location = f"/app/data/{company}_{file.filename}"
    with open(file_location, "wb") as buffer:
        buffer.write(file.file.read())
    
    # Read the file content
    with open(file_location, "r") as file:
        file_content = file.read()
    
    # Create schema per company in Weaviate
    class_name = latent_db.create_schema(company)
    
    # Upload the file content to Weaviate
    if file_type == "financial":
        # Handle financial file summary
        file_summary = llm.summarize_content(file_content)
        latent_db.upload_content(class_name, file_summary, file_location)
    else:
        latent_db.upload_content(class_name, file_content, file_location)
    
    return UploadResponse(
        company=company,
        file_name=file.filename,
        file_type=file_type,
        detail="File uploaded successfully"
    )
