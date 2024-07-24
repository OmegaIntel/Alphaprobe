from typing import Literal
from pydantic import BaseModel


class UploadResponse(BaseModel):
    company: str
    file_name: str
    file_type: Literal["descriptive", "financial"]
    detail: str
