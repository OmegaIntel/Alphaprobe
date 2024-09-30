from sqlalchemy import Column, String, Text, TIMESTAMP, ForeignKey, func, Enum
from sqlalchemy_utils import UUIDType
from sqlalchemy.ext.declarative import declarative_base
import uuid
from .users import User
from .deals import Deal
from enum import Enum as PyEnum

Base = declarative_base()

class NewUsersDeals(Base):
    __tablename__ = "newUsersDeals"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    email_id = Column(String(255), nullable=False)
    deal_id = Column(UUIDType(binary=False), ForeignKey(Deal.id, ondelete='CASCADE'), nullable=False)
