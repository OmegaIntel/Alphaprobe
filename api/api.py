# api.py
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Literal
import os

from api.db_models.weaviate_db import WeaviateDb
from api.llm_models.llm import LLM
from api.search.bing_search import BingSearch

router = APIRouter()

weaviate_handler = WeaviateDb()
llm_wrapper = LLM()
bing_search = BingSearch()

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

    # Check if the query is about real-world data using LLM
    if llm_wrapper.is_real_world_query(user_message):
        # Perform a search on Bing
        search_results = bing_search.search(user_message)
        parsed_results = bing_search.parse_search_results(search_results)

        if not parsed_results:
            raise HTTPException(status_code=400, detail="No relevant data found for the query.")

        # Retrieve context from Weaviate
        weaviate_context = weaviate_handler.get_context(user_message, company)

        # Concatenate context from both sources
        context = ' '.join([entry["content"] for entry in conversation if entry["role"] == "ai"])
        if weaviate_context:
            context += ' ' + ' '.join([res['content'] for res in weaviate_context])
        context += " \n following is search result from internet \n "
        for result in parsed_results:
            context += f" {result['name']}: {result['snippet']} (Source: {result['url']})"

        # Generate response using the LLM
        ai_response = llm_wrapper.generate_response(user_message, context)
        return ChatResponse(response=ai_response)

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

@router.get("/companies")
async def get_companies():
    companies = weaviate_handler.get_registered_companies()
    return {"companies": companies}
