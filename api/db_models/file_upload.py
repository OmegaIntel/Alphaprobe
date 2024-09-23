from sqlalchemy import Column, String, Text, ForeignKey, ARRAY, JSON
from sqlalchemy_utils import UUIDType
import uuid
from sqlalchemy.ext.declarative import declarative_base
from db_models.deals import Deal

Base = declarative_base()


class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(255), nullable=True)
    sub_category = Column(String(255), nullable=True)
    tags = Column(JSON(), nullable=True)
    file_path = Column(String(255), nullable=False)  
    deal_id = Column(UUIDType(binary=False), ForeignKey(Deal.id, ondelete='CASCADE'), nullable=False)
