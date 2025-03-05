from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy_utils import UUIDType
from sqlalchemy.ext.declarative import declarative_base
import uuid
Base = declarative_base()


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUIDType(binary=False), primary_key=True, index=True, default=uuid.uuid4)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)  # Store the path where the document is saved

    project = relationship("Project", back_populates="documents")
