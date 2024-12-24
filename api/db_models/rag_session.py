from sqlalchemy import Column, String, TIMESTAMP, JSON, func
from sqlalchemy_utils import UUIDType
from sqlalchemy.ext.declarative import declarative_base
import uuid

Base = declarative_base()

class RagSession(Base):
    __tablename__ = "rag_sessions"

    session_id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType(binary=False), nullable=False)  # No ForeignKey constraint
    last_access_time = Column(TIMESTAMP, nullable=False, server_default=func.now())
    data = Column(JSON, nullable=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<RagSession(session_id={self.session_id}, user_id={self.user_id}, last_access_time={self.last_access_time})>"
