"""Returns a list of related industries in response to UI request."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from llm_models.aws_bedrock.llm_response import matching_industry_names_codes_from_qa
from api.data.data_access import IBIS_NAICS_CODES, IBIS_REPORT_NAMES, IBIS_MAP


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
    # TODO: implement the restriction part on this end.
    result = matching_industry_names_codes_from_qa(llm_input)

    # populate with the actual items that we have, less generic, generally.
    # TODO: merge it with the other function (ibis_industries)
    out = []
    IC = 'industry_code'
    IN = 'industry_name'
    SET_IBIS_NAICS_CODES = set(IBIS_NAICS_CODES)
    for elt in result:
        if elt[IC] in SET_IBIS_NAICS_CODES:
            out.append(elt)
        else:
            for code, industry in zip(IBIS_NAICS_CODES, IBIS_REPORT_NAMES):
                if code.startswith(elt[IC]):
                    out.append({IC: code, IN: industry})
                    break

    return DataModelOut(result=out)
