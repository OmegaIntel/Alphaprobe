from sqlalchemy import Column, String, Text, TIMESTAMP, ForeignKey, func, Enum
from sqlalchemy_utils import UUIDType
from sqlalchemy.ext.declarative import declarative_base
import uuid
from .users import User
from .deals import Deal
from .utils import UserRole

Base = declarative_base()

class SharedUserDeals(Base):
    __tablename__ = "sharedUserDeals"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType(binary=False), ForeignKey(User.id, ondelete='CASCADE'), nullable=False)
    deal_id = Column(UUIDType(binary=False), ForeignKey(Deal.id, ondelete='CASCADE'), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
