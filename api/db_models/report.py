from sqlalchemy import Column, String, Text, TIMESTAMP, ForeignKey, func, DateTime
from sqlalchemy_utils import UUIDType
from sqlalchemy.ext.declarative import declarative_base
import uuid

Base = declarative_base()

class Report(Base):
    __tablename__ = "reports"

    id = Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    deal_id = Column(UUIDType(binary=False), nullable=False)  # Updated to UUIDType
    report_data = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Report(id={self.id}, deal_id={self.deal_id}, created_at={self.created_at})>"
