# api/api_chat.py
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel
from typing import List, Literal
from api.db_models.weaviate_db import WeaviateChatSessionDb, WeaviateDbRetriever
from api.llm_models.llm import LLM
from api.search.bing_search import BingSearch
from api.stock.openbb_stock_api import OpenBBStockAPI
from api.metrics.openbb_metrics_api import OpenBBMetricsAPI
from api.api.api_user import get_current_user, User
from api.interfaces import Retriever

chat_router = APIRouter()

chat_session_db_handler = WeaviateChatSessionDb()
weaviate_retriever_handler = WeaviateDbRetriever()
llm_wrapper = LLM()
bing_search = BingSearch()
openbb_stock_api = OpenBBStockAPI()
openbb_metrics_api = OpenBBMetricsAPI()


RETRIEVERS = {
    'web_search': bing_search,
    'documents': weaviate_retriever_handler,
    'ticker_metrics': openbb_metrics_api,
    'ticker_history': openbb_stock_api,
}

CURRENT_RETRIEVER = 'web_search'
DEFAULT_RETRIEVER = weaviate_retriever_handler


with open('/app/api/prompts/intro_prompt.txt', 'r') as file:
    intro_prompt = file.read()


class CompanyRegistrationRequest(BaseModel):
    company_name: str

class ChatRequest(BaseModel):
    conversation: List[dict[str, str]]

class ChatResponse(BaseModel):
    response: str

class UploadResponse(BaseModel):
    company: str
    file_name: str
    detail: str

class ChatSession(BaseModel):
    id: str
    name: str

class MessageRequest(BaseModel):
    content: str
    company: str

class RetrieverRequest(BaseModel):
    retriever: str

class RetrieverResponse(BaseModel):
    retriever: str

class ChatMessagesResponse(BaseModel):
    messages: List[dict[str, str]]

@chat_router.post("/chat/sessions", response_model=ChatSession)
async def create_chat_session(current_user: User = Depends(get_current_user)):
    session_id, session_name = chat_session_db_handler.create_chat_session(current_user.email)
    return ChatSession(id=session_id, name=session_name)

@chat_router.get("/chat/sessions", response_model=List[ChatSession])
async def get_chat_sessions(current_user: User = Depends(get_current_user)):
    sessions = chat_session_db_handler.get_chat_sessions(current_user.email)
    return [ChatSession(id=session.get('session_id', session.get('_id', '')), name=session.get('session_name', 'Session')) for session in sessions]

@chat_router.get("/chat/{session_id}/messages", response_model=ChatMessagesResponse)
async def get_chat_messages(session_id: str, current_user: User = Depends(get_current_user)):
    messages = chat_session_db_handler.get_chat_messages(session_id, current_user.email)
    if messages is None:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return ChatMessagesResponse(messages=messages)

@chat_router.post("/chat/retriever", response_model=RetrieverResponse)
async def set_retriever(session_id: str, request: RetrieverRequest, current_user: User = Depends(get_current_user)):
    session = chat_session_db_handler.get_chat_session(session_id, current_user.email)
    if session is None:
        raise HTTPException(status_code=404, detail="Chat session not found")
    CURRENT_RETRIEVER = request.retriever

@chat_router.post("/chat/{session_id}/message", response_model=ChatResponse)
async def send_message(session_id: str, request: MessageRequest, current_user: User = Depends(get_current_user)):
    session = chat_session_db_handler.get_chat_session(session_id, current_user.email)
    if session is None:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # Extract the company from the request
    company = request.company
    
    # Initialize conversation with existing messages or empty if none
    conversation = session.get('messages', []) + [{"role": "user", "content": request.content}]
    message_count = len(conversation)
    # Extract user message
    user_message = request.content
    
    # Initialize the context
    context = 'old messages:\n'
    for entry in conversation:
        context += f"\n{entry['role']}: {entry['content']}"

    weaviate_context = weaviate_retriever_handler.get_context(user_message, company, current_user.email)
    original_user_message = user_message
    user_message = llm_wrapper.enhance_user_message(
        company_context=weaviate_context, 
        past_messages_context=context,
        user_message=user_message
    )

    retriever: Retriever = RETRIEVERS.get(CURRENT_RETRIEVER, DEFAULT_RETRIEVER)
    context = retriever.llm_context(user_message, company, current_user.email)

    # Generate the AI response using the full context
    context = "General Introduction about tool:\n" + intro_prompt + " Current task at hand:\n " + context
    ai_response = llm_wrapper.generate_response(user_message, context)

    # Save both the user's message and the AI's response
    ai_message = {"role": "ai", "content": ai_response}
    user_message = {"role": "user", "content": original_user_message}
    chat_session_db_handler.save_chat_message(session_id, user_message, ai_message, current_user.email)

    if message_count < 10:
        session_summary = chat_session_db_handler.llm.generate_summary_name(user_message["content"], ai_message["content"])
        chat_session_db_handler.update_chat_session_name(session_id, session_summary)

    return ChatResponse(response=ai_response)

@chat_router.delete("/chat/sessions/{session_id}", status_code=204)
async def delete_chat_session(session_id: str, user=Depends(get_current_user)):
    result = chat_session_db_handler.delete_chat_session(session_id, user.email)
    print(result)
    if result is None:
        raise HTTPException(status_code=404, detail="Session not found or not authorized")
    elif "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return {"message": "Session deleted successfully"}


@chat_router.post("/upload", response_model=UploadResponse)
async def upload_file(
    company: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)  # Get the current user
):
    file_location = f"/app/data/{company}_{file.filename}"
    with open(file_location, "wb") as buffer:
        buffer.write(await file.read())

    # Ensure the company schema is associated with the current user
    class_name = weaviate_retriever_handler.create_company_schema(company, current_user.email)
    weaviate_retriever_handler.upload_content(class_name, file_location, current_user.email)
    
    return UploadResponse(
        company=company,
        file_name=file.filename,
        detail="File uploaded successfully"
    )


@chat_router.get("/companies")
async def get_companies(current_user: User = Depends(get_current_user)):
    companies = weaviate_retriever_handler.get_registered_companies(current_user.email)
    return {"companies": companies}
