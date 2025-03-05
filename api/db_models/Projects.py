from sqlalchemy import Column, Integer, String, DateTime, TIMESTAMP, func
from sqlalchemy.orm import relationship
from sqlalchemy_utils import UUIDType
from sqlalchemy.ext.declarative import declarative_base
import uuid
Base = declarative_base()

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUIDType(binary=False), primary_key=True, index=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, default=func.current_timestamp())
    documents = relationship("Document", back_populates="project", cascade="all, delete")
