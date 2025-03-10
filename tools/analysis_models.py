from pydantic import BaseModel, Field


class UserQuery(BaseModel):
    question: str = Field(..., description="User query")
