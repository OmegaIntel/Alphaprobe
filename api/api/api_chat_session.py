from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel
from typing import List
import uuid
from sqlalchemy.orm import Session
from db_models.session import get_db  
from llm_models.llm import LLM
from search.bing_search import BingSearch
from api.api_user import get_current_user, User
from db_models.chat import ChatSession,ChatMessage
from db_models.weaviatedb import WeaviateManager
from stock.openbb_stock_api import OpenBBStockAPI
from metrics.openbb_metrics_api import OpenBBMetricsAPI
from db_models.deals import Deal
from pydantic import ValidationError
from db_models.users import User
from uuid import UUID
from typing import Optional
from api.api_user import get_current_user, User as UserModelSerializer
from fastapi import HTTPException, status
from db_models.shared_user_deals import SharedUserDeals
from db_models.workspace import CurrentWorkspace
from sqlalchemy import or_
from sqlalchemy import asc


chat_router = APIRouter()

weaviate_handler = WeaviateManager()
llm_wrapper = LLM()
bing_search = BingSearch()
openbb_stock_api = OpenBBStockAPI()
openbb_metrics_api = OpenBBMetricsAPI()

# RETRIEVERS = {
#     'web_search': bing_search,
#     'documents': weaviate_handler,
#     'ticker_metrics': openbb_metrics_api,
#     'ticker_history': openbb_stock_api,
# }

# CURRENT_RETRIEVER = 'web_search'
# DEFAULT_RETRIEVER = weaviate_handler

# with open('/api/prompts/intro_prompt.txt', 'r') as file:
#     intro_prompt = file.read()
#     print("Intro prompt is:", intro_prompt)

def sanitize_class_name(name: str) -> str:
    sanitized = ''.join(e for e in name if e.isalnum())
    return sanitized.capitalize()

def sanitize_class_name_nocap(name: str) -> str:
    sanitized = ''.join(e for e in name if e.isalnum())
    return sanitized


class ChatSessionResponse(BaseModel):
    id: str
    name: str

class ChatSessioninput(BaseModel):
    id: str
    name: str

class ChatResponse(BaseModel):
    response: str

class MessageRequest(BaseModel):
    content: str
    deal_id: Optional[str]=None

class RetrieverRequest(BaseModel):
    retriever: str

class RetrieverResponse(BaseModel):
    retriever: str

class ChatMessagesResponse(BaseModel):
    messages: List[dict[str, str]]

@chat_router.post("/api/chat/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    deal_id: Optional[str] = Form(None),
    is_global: bool = Form(False), 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session_id = str(uuid.uuid4())
    if not is_global and not deal_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="deal_id is required when is_global is False."
        )
    if is_global:
        user_id = current_user.id
        user_id = sanitize_class_name_nocap(user_id)
        session_name = f"Chat Session for usr {user_id}"
        new_session = ChatSession(id=session_id, user_id=user_id, session_name=session_name)
    else:
        deal_id = sanitize_class_name_nocap(deal_id)
        session_name = f"Chat Session for Deal {deal_id}"
        new_session = ChatSession(id=session_id, deal_id=deal_id, session_name=session_name)

    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return ChatSessionResponse(id=session_id, name=session_name)

@chat_router.get("/api/chat/{session_id}/messages", response_model=ChatMessagesResponse)
async def get_chat_messages(session_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).all()
    if not messages:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return ChatMessagesResponse(messages=[{"role": msg.role, "content": msg.content} for msg in messages])

@chat_router.post("/api/chat/{session_id}/message", response_model=ChatResponse)
async def send_message(session_id: str,content: str = Form(...), deal_id: Optional[str] = Form(None),is_global: bool = Form(False), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if session is None:
        raise HTTPException(status_code=404, detail="Chat session not found")
    user_message = content
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).all()
    conversation = [{"role": msg.role, "content": msg.content} for msg in messages]
    if not is_global:
        deal_id = sanitize_class_name("d"+ deal_id)
    else:
        deal_id = "Dadmin"
      
    context = 'old messages:\n'
    for entry in conversation:
        context += f"\n{entry['role']}: {entry['content']}"

    # retriever: Retriever = RETRIEVERS.get(CURRENT_RETRIEVER, DEFAULT_RETRIEVER)
    # context = retriever.llm_context(user_message, deal_id, current_user.email)
    weaviate_context = weaviate_handler.retrieve_content(user_message, deal_id)
    original_user_message = user_message
    user_message = llm_wrapper.enhance_user_message(
        deal_context=weaviate_context, 
        past_messages_context=context,
        user_message=user_message
    )
    new_user_message = ChatMessage(
        id=str(uuid.uuid4()),  
        session_id=session.id,
        role="user",
        content=original_user_message
    )
    db.add(new_user_message)
    db.commit()
    ai_response = llm_wrapper.generate_response(user_message, weaviate_context)
    new_ai_message = ChatMessage(
        id=str(uuid.uuid4()), 
        session_id=session.id,
        role="ai",
        content=ai_response
    )
    db.add(new_ai_message)
    db.commit()
    return ChatResponse(response=ai_response)

@chat_router.delete("/api/chat/sessions/{session_id}", response_model=None)
async def delete_chat_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db.query(ChatMessage).filter(ChatMessage.session_id == session.id).delete()
    db.delete(session)
    db.commit()
    return {"message": "Session deleted successfully"}


@chat_router.get("/api/chat_sessions/")
def get_chat_sessions(deal_id: str, db: Session = Depends(get_db)):
    chat_sessions = db.query(ChatSession).filter(ChatSession.deal_id == deal_id).all()
    if not chat_sessions:
        raise HTTPException(status_code=404, detail="No chat sessions found for this deal ID")
    return chat_sessions


@chat_router.post("/api/workspace/add/{session_id}")
async def add_to_workspace(type: str, session_id: str,deal_id: str = Form(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(asc(ChatMessage.created_at)).all()
    payload_string = ""
    for msg in messages:
        payload_string += f"**{msg.role}**" +":" + " " + msg.content + "\n"
    data=db.query(Deal).filter(Deal.id==deal_id and Deal.user_id==current_user.id).first()
    if not data:
        shared_deal = db.query(SharedUserDeals).filter(SharedUserDeals.user_id == current_user.id).first()
        if shared_deal:
            pass
        else:
            raise HTTPException(status_code=404, detail="You are not authorized to add workspace")
    new_ws = CurrentWorkspace(deal_id=deal_id, text=payload_string, type=type)
    db.add(new_ws)
    db.commit()
    db.refresh(new_ws)
    return {"message":"messages added to current workspace successfully"}