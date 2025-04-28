from sqlalchemy import Column, Integer, String, Text,  ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy_utils import UUIDType
from sqlalchemy.ext.declarative import declarative_base
import uuid
from .projects import Project
Base = declarative_base()


class DocumentTable(Base):
    __tablename__ = "documents_table"

    id = Column(UUIDType(binary=False), primary_key=True, index=True, default=uuid.uuid4)
    project_id = Column(UUIDType(binary=False), ForeignKey(Project.id, ondelete='CASCADE'), nullable=False)
    file_name = Column(Text, nullable=False)
    file_path = Column(Text, nullable=False)  # Store the path where the document is saved
