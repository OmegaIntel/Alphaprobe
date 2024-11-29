"""Returns a list of related industries in response to UI request."""
import json

import pandas as pd

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from llm_models.aws_bedrock.llm_response import matching_industry_names_codes_from_qa_using_embeds
from api.data.data_access import IBIS_NAICS_CODES, IBIS_REPORT_NAMES, IBIS_MAP

IBIS_EMBEDDINGS = pd.read_csv('api/data/ibis_embeddings.csv')
IBIS_EMBEDDINGS["query_embedding"] = IBIS_EMBEDDINGS["query_embedding"].apply(lambda x: json.loads(x))


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
        if len(elt.question) == 0:
            raise Exception("The field 'question' should not be empty in request")
        if len(elt.response) == 0:
            raise Exception("The field 'response' should not be empty in request")
        llm_input.append({'question': elt.question, 'answer': elt.response})

    # TODO: implement the industry code restriction part on this end.
    result = matching_industry_names_codes_from_qa_using_embeds(llm_input, IBIS_EMBEDDINGS)

    return DataModelOut(result=result)
