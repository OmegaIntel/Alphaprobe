from sqlalchemy import Column, String, Text, Boolean, ForeignKey, JSON, TIMESTAMP, func
from sqlalchemy_utils import UUIDType
from db_models.base import Base
import uuid


class FinancialModel(Base):
    __tablename__ = "financial_models"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)

    user_id = Column(UUIDType(binary=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    company_name = Column(String(255), nullable=False)

    model_group_id = Column(UUIDType(binary=False), ForeignKey("financial_models.id", ondelete="SET NULL"), nullable=True)

    original_file_s3 = Column(Text, nullable=False)
    updated_model_s3 = Column(Text, nullable=True)

    mapping_json = Column(JSON, nullable=True)
    is_initial_upload = Column(Boolean, default=False)
    note = Column(Text, nullable=True)

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
