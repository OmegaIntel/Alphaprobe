from sqlalchemy import Column, TIMESTAMP, ForeignKey, func,String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy_utils import UUIDType
from db_models.deals import Deal
import uuid

Base = declarative_base()

class ToDo(Base):
    __tablename__ = "todos"
    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    deal_id = Column(UUIDType(binary=False), ForeignKey(Deal.id, ondelete='CASCADE'), nullable=False)
    task = Column(String(255), nullable=False)
    status = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
