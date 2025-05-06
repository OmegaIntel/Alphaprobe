from sqlalchemy import Column, String, TIMESTAMP, func, Text, Boolean
from db_models.base import Base
from sqlalchemy.orm import relationship
from sqlalchemy_utils import UUIDType
import uuid



# Define the User model
class User(Base):
    __tablename__ = "users"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    calendly_access_token = Column(Text, nullable=True)
    calendly_refresh_token = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    is_master_admin=Column(Boolean, default=False,nullable=False)
