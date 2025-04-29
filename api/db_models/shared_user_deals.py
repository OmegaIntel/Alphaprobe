# db_models/shared_user_deals.py

from sqlalchemy import Column, String, Text, TIMESTAMP, ForeignKey, func, Enum
from sqlalchemy_utils import UUIDType
from sqlalchemy.ext.declarative import declarative_base
import uuid
from .users import User
from .deals import Deal
from enum import Enum as PyEnum

Base = declarative_base()

class SharedUserDeals(Base):
    __tablename__ = "sharedUserDeals"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType(binary=False), ForeignKey(User.id, ondelete='CASCADE'), nullable=False)
    deal_id = Column(UUIDType(binary=False), ForeignKey(Deal.id, ondelete='CASCADE'), nullable=False)