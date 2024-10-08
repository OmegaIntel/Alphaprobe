from sqlalchemy import Column, String, Text, ForeignKey, DateTime,func,TIMESTAMP,Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from db_models.users import User
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy_utils import UUIDType
import uuid
from db_models.deals import Deal
from enum import Enum as PyEnum

Base = declarative_base()
class LikeDislikeStatus(PyEnum):
    NONE = None
    LIKE = "like"
    DISLIKE = "dislike"

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    deal_id = Column(String(255), ForeignKey(Deal.id),nullable=True)  
    session_name = Column(String(255),nullable=True,default=None)  
    user_id= Column(String(255), ForeignKey(User.id),nullable=True)
    created_at = Column(DateTime, default=func.now())

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    session_id = Column(ForeignKey(ChatSession.id))
    role = Column(Text)  
    content = Column(Text)
    like_dislike_status = Column(Enum(LikeDislikeStatus), default=LikeDislikeStatus.NONE)
    created_at = Column(DateTime, default=func.now())