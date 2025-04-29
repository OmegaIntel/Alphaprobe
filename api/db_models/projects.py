# db_models/projects.py

from sqlalchemy import Column, String, Text, TIMESTAMP, func, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy_utils import UUIDType
from sqlalchemy.ext.declarative import declarative_base
from .users import User
import uuid
Base = declarative_base()

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUIDType(binary=False), primary_key=True, index=True, default=uuid. uuid4)
    name = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp())
    temp_project_id=Column(UUIDType(binary=False), index=True)
    user_id = Column(UUIDType(binary=False), ForeignKey(User.id, ondelete='CASCADE'), nullable=False)
