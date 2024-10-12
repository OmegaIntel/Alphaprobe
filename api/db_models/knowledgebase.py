from sqlalchemy import Column, Text , ForeignKey, func,String
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy_utils import UUIDType
from db_models.deals import Deal
import uuid

Base = declarative_base()

class knowledgebase(Base):
    __tablename__ = "knowledge_base"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    deal_id = Column(UUIDType(binary=False), ForeignKey(Deal.id, ondelete='CASCADE'), nullable=False)
    type = Column(String(255), nullable=False)
    text = Column(Text, nullable=False)
  