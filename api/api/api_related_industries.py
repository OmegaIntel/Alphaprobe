"""Returns a list of related industries in response to UI request."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from llm_models.aws_bedrock.llm_response import matching_industry_names_codes_from_qa


class UserQR(BaseModel):
    question: str
    response: str

class DataModelIn(BaseModel):
    data: List[UserQR]


class IndustryCode(BaseModel):
    industry_name: str
    industry_code: str

class DataModelOut(BaseModel):
    result: List[IndustryCode]


related_industries_router = APIRouter()


@related_industries_router.post("/api/industries-for-thesis", response_model=DataModelOut)
async def industries_for_thesis(request: DataModelIn):
    """Takes users Questions and Answers and returns a list of industries and their codes."""
    user_qr = request.data
    llm_input = []
    for elt in user_qr:
        assert elt.question, elt.response
        llm_input.append({'question': elt.question, 'answer': elt.response})
    result = matching_industry_names_codes_from_qa(llm_input)
    return DataModelOut(result=result)
