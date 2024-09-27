from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel
from typing import List
import uuid
from sqlalchemy.orm import Session
from api.db_models.workspace import CurrentWorkspace
from db_models.session import get_db  
from api.llm_models.llm import LLM
from api.search.bing_search import BingSearch
from api.api.api_user import get_current_user, User
from db_models.chat import ChatSession,ChatMessage
from db_models.weaviatedb import WeaviateManager
from api.stock.openbb_stock_api import OpenBBStockAPI
from api.metrics.openbb_metrics_api import OpenBBMetricsAPI
from api.db_models.deals import Deal
from pydantic import ValidationError
from db_models.users import User
from uuid import UUID
from typing import Optional
from api.api_user import get_current_user, User as UserModelSerializer


chat_router = APIRouter()

weaviate_handler = WeaviateManager()
llm_wrapper = LLM()
bing_search = BingSearch()
openbb_stock_api = OpenBBStockAPI()
openbb_metrics_api = OpenBBMetricsAPI()

def sanitize_class_name(name: str) -> str:
    sanitized = ''.join(e for e in name if e.isalnum())
    return sanitized.capitalize()

def sanitize_class_name_without_cap(name: str) -> str:
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
    deal_id: str

class RetrieverRequest(BaseModel):
    retriever: str

class RetrieverResponse(BaseModel):
    retriever: str

class ChatMessagesResponse(BaseModel):
    messages: List[dict[str, str]]

@chat_router.post("/chat/sessions", response_model=ChatSessionResponse)
async def create_chat_session(deal_id: str = Form(...), db: Session = Depends(get_db)):
    session_id = str(uuid.uuid4())
    session_name = f"Chat Session for Deal {deal_id}"
    deal_id=sanitize_class_name_without_cap(deal_id)
    new_session = ChatSession(id=session_id, deal_id=deal_id, session_name=session_name)
    db.add(new_session)
    db.commit()
    return ChatSessionResponse(id=session_id, name=session_name)

@chat_router.get("/chat/{session_id}/messages", response_model=ChatMessagesResponse)
async def get_chat_messages(session_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).all()
    if not messages:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return ChatMessagesResponse(messages=[{"role": msg.role, "content": msg.content} for msg in messages])

@chat_router.post("/chat/{session_id}/message", response_model=ChatResponse)
async def send_message(session_id: str, request: MessageRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if session is None:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    user_message = request.content
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).all()
    conversation = [{"role": msg.role, "content": msg.content} for msg in messages]
    
    deal_id = "d"+request.deal_id
    deal_id = sanitize_class_name(deal_id)
    context = 'old messages:\n'
    for entry in conversation:
        context += f"\n{entry['role']}: {entry['content']}"

    weaviate_context = weaviate_handler.retrieve_content(user_message, deal_id)
    original_user_message = user_message
    user_message = llm_wrapper.enhance_user_message(
        deal_context=weaviate_context, 
        past_messages_context=context,
        user_message=user_message
    )
    ai_response = llm_wrapper.generate_response(user_message, weaviate_context)
    new_user_message = ChatMessage(
        id=str(uuid.uuid4()),  
        session_id=session.id,
        role="user",
        content=original_user_message
    )
    new_ai_message = ChatMessage(
        id=str(uuid.uuid4()), 
        session_id=session.id,
        role="ai",
        content=ai_response
    )
    db.add(new_user_message)
    db.add(new_ai_message)
    db.commit()
    return ChatResponse(response=ai_response)

@chat_router.delete("/chat/sessions/{session_id}", status_code=204)
async def delete_chat_session(session_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.deal_id.in_(
            db.query(Deal.id).filter(Deal.user_id == current_user.id)
        )
    ).first()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or not authorized")
    db.query(ChatMessage).filter(ChatMessage.session_id == session.id).delete()
    db.delete(session)
    db.commit()
    return {"message": "Session deleted successfully"}

@chat_router.post("/workspace/add/{session_id}")
async def add_to_workspace(type: str, session_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).all()
    deal_id = db.query(ChatSession).filter(session_id==session_id).first().deal_id
    payload_string = ""
    for msg in messages:
        payload_string += msg.role +":" + " " + msg.content + "\n"
    data=db.query(Deal).filter(Deal.id==deal_id).first()
    if str(data.user_id) != current_user.id:
        raise HTTPException(status_code=404, detail="You are not authorized to add workspace")
    new_ws = CurrentWorkspace(deal_id=deal_id, text=payload_string, type=type)
    db.add(new_ws)
    db.commit()
    db.refresh(new_ws)

    return {"message":"messages added to current workspace successfully"}
     
