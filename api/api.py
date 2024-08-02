from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Literal
import os

from api.db_models.weaviate_db import WeaviateDb
from api.llm_models.llm import LLM

router = APIRouter()

weaviate_handler = WeaviateDb()
llm_wrapper = LLM()

class CompanyRegistrationRequest(BaseModel):
    company_name: str

class ChatRequest(BaseModel):
    company: str
    conversation: list[dict[str, str]]

class ChatResponse(BaseModel):
    response: str

class UploadResponse(BaseModel):
    company: str
    file_name: str
    file_type: str
    detail: str

class UserRegistrationRequest(BaseModel):
    email: str
    password: str

class UserLoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register_user")
async def register_user(request: UserRegistrationRequest):
    email = request.email
    password = request.password
    
    if weaviate_handler.register_user(email, password):
        return {"detail": "User registered successfully"}
    else:
        raise HTTPException(status_code=400, detail="User already exists")

@router.post("/login_user")
async def login_user(request: UserLoginRequest):
    email = request.email
    password = request.password
    
    if weaviate_handler.authenticate_user(email, password):
        return {"detail": "Login successful"}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/companies")
async def register_company(request: CompanyRegistrationRequest):
    company_name = request.company_name
    if weaviate_handler.register_company(company_name):
        return {"detail": "Company registered successfully"}
    else:
        raise HTTPException(status_code=400, detail="Company already registered")

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    conversation = request.conversation
    company = request.company

    # Extract user message from the conversation
    user_message = conversation[-1]["content"]

    # Query Weaviate for context
    query_result = weaviate_handler.get_context(user_message, company)
    
    # Concatenate all previous conversation and context
    context = ' '.join([entry["content"] for entry in conversation if entry["role"] == "ai"])
    if query_result:
        context += ' ' + ' '.join([res['content'] for res in query_result])
    
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
        buffer.write(await file.read())
    
    # Upload file content to Weaviate
    with open(file_location, "r") as file_content:
        content = file_content.read()
        class_name = weaviate_handler.create_schema(company)
        weaviate_handler.upload_content(class_name, content, file_location)
    
    return UploadResponse(
        company=company,
        file_name=file.filename,
        file_type=file_type,
        detail="File uploaded and content stored successfully"
    )
