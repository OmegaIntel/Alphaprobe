"""Returns industry summary in response to UI request. Starts with IBIS."""

from fastapi import APIRouter
from pydantic import BaseModel

from typing import List, Dict

import pandas as pd

IBIS_MAP_FILENAME = 'data/IBIS NAICS Code mapping.xlsx'
IBIS_MAP = pd.read_excel(IBIS_MAP_FILENAME)
NAICS_CODE = 'NAICS Code'
IBIS_REPORT_NAME = 'IBIS Report Name'


def ibis_industries(code: str, name: str) -> List[str]:
    """Use primarily code. If not found, use heuristics."""
    code = int(code)
    rows = IBIS_MAP[IBIS_MAP[NAICS_CODE] == code].copy()
    names = list(rows[IBIS_REPORT_NAME])
    if names:
        return names
    return [name]


class Industry(BaseModel):
    source: str
    industry_name: str
    industry_code: str

class DataModelIn(BaseModel):
    data: Industry


class DataModelOut(BaseModel):
    result: List[Dict]


industry_summary_router = APIRouter()


@industry_summary_router.post("/api/industry-summary", response_model=DataModelOut)
async def industry_summary_for_thesis(request: DataModelIn):
    """Returns industry summary based on the source (IBIS to start with)."""
    data = request.data
    source, name, code = data.source, data.industry_name, data.industry_code
    assert source == 'IBIS'
    industry_names = ibis_industries(code, name)
    assert industry_names

    result = []
    for industry_name in industry_names:
        result.append({industry_name: industry_name, 'temp': 'temp-temp'})
    return DataModelOut(result=result)

    llm_input = []
    for elt in user_qr:
        assert elt.question, elt.response
        llm_input.append({'question': elt.question, 'answer': elt.response})
    result = matching_industry_names_codes_from_qa(llm_input)
    return DataModelOut(result=result)
