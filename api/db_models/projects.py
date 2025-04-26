from sqlalchemy import Column, String, Text, TIMESTAMP, func, ForeignKey, Enum as SQLAEnum
from sqlalchemy.orm import relationship
from sqlalchemy_utils import UUIDType
from sqlalchemy.ext.declarative import declarative_base
from .users import User
import uuid
import enum

Base = declarative_base()

class WorkflowType(enum.Enum):
    general = "general"
    due_diligence = "due_diligence"
    market_research = "market_research"
    competitive_analysis = "competitive_analysis"

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUIDType(binary=False), primary_key=True, index=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp())
    temp_project_id = Column(UUIDType(binary=False), index=True)
    user_id = Column(UUIDType(binary=False), ForeignKey(User.id, ondelete='CASCADE'), nullable=False)
    workflow = Column(SQLAEnum(WorkflowType), nullable=False, default=WorkflowType.general)
