from pydantic import BaseModel
from typing import List, Dict

class ChatRequest(BaseModel):
    company: str
    conversation: List[Dict[str, str]]
