from sqlalchemy import Column, String, TIMESTAMP, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy_utils import UUIDType
import uuid

Base = declarative_base()

# Define the User model
class User(Base):
    __tablename__ = "users"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
