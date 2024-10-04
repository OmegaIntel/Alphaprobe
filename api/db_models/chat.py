from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from db_models.users import User
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy_utils import UUIDType
import uuid
from db_models.deals import Deal

Base = declarative_base()

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    deal_id = Column(String(255), ForeignKey(Deal.id),nullable=True)  
    session_name = Column(String(255))  
    user_id= Column(String(255), ForeignKey(User.id),nullable=True)

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    session_id = Column(ForeignKey(ChatSession.id))
    role = Column(Text)  
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)