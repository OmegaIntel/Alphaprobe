from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from api.models.chat.chat_request import ChatRequest
from api.models.chat.chat_response import ChatResponse
from api.models.files.upload_response import UploadResponse
from typing import Literal
import os

from api.db_models.weaviate_db import WeaviateDb
from api.llm_models.llm import LLM

router = APIRouter()

weaviate_handler = WeaviateDb()
llm_wrapper = LLM()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    user_message = request.message
    company = request.company
    
    # Query Weaviate for context
    query_result = weaviate_handler.get_context(user_message, company)
    
    # If no context found, respond with a message
    if not query_result:
        ai_response = "No relevant context found."
    else:
        # Concatenate the contexts
        context = ' '.join([res['content'] for res in query_result])
        
        # Generate response using the LLM
        ai_response = llm_wrapper.generate_response(user_message, context)
    
    return ChatResponse(response=ai_response)



@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    company: str = Form(...),
    file_type: Literal["descriptive", "financial"] = Form(...),
    file: UploadFile = File(...)
):
    file_location = f"/app/data/{company}_{file.filename}"
    with open(file_location, "wb") as buffer:
        buffer.write(await file.read())  # Use await to read file content asynchronously
    
    with open(file_location, "r") as file_obj:
        file_content = file_obj.read()
    
    class_name = weaviate_handler.create_schema(company)
    
    if file_type == "financial":
        file_summary = llm_wrapper.summarize_content(file_content)
        weaviate_handler.upload_content(class_name, file_summary, file_location)
    else:
        weaviate_handler.upload_content(class_name, file_content, file_location)
    
    return UploadResponse(
        company=company,
        file_name=file.filename,
        file_type=file_type,
        detail="File uploaded successfully"
    )
