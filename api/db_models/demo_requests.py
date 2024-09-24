import uuid
from sqlalchemy import Column, String, Text
from sqlalchemy_utils import UUIDType
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class DemoRequests(Base):
    __tablename__ = 'demo_requests'

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    email = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
