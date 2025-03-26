# db_models/models.py
from sqlalchemy import Column, String, TIMESTAMP, func, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy_utils import UUIDType
import uuid

Base = declarative_base()

class ContactUs(Base):
    __tablename__ = "contact_us"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=True)
    message = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())