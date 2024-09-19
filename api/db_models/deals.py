from sqlalchemy import Column, String, Text, TIMESTAMP, ForeignKey, func
from sqlalchemy_utils import UUIDType
from sqlalchemy.ext.declarative import declarative_base
import uuid
from .users import User

Base = declarative_base()

class Deal(Base):
    __tablename__ = "deals"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType(binary=False), ForeignKey(User.id, ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)
    overview = Column(Text)
    start_date = Column(TIMESTAMP, default=func.current_timestamp())
    due_date = Column(TIMESTAMP)
    industry = Column(String(255))
    progress = Column(String(255))
