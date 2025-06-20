from sqlalchemy import Column, Text, Enum, JSON, TIMESTAMP, func, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy_utils import UUIDType
from sqlalchemy.ext.declarative import declarative_base
import uuid
from .projects import Project
Base = declarative_base()


class ReportTable(Base):
    __tablename__ = "reports_table"

    id = Column(UUIDType(binary=False), primary_key=True, index=True, default=uuid.uuid4)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp())
    project_id = Column(UUIDType(binary=False), ForeignKey(Project.id, ondelete='CASCADE'), nullable=False)
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=True)
    sections = Column(JSON, nullable=True)
    citations = Column(JSON, nullable=True)
    research = Column(Enum("deep", "research", name="research_type"), nullable=False, default="research")
