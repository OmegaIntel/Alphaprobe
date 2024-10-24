"""Returns industry summary in response to UI request. Starts with IBIS."""

from fastapi import APIRouter
from pydantic import BaseModel
import json

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


def mock_summaries() -> List[dict]:
    out = []
    filenames = ['data/atv-manufacturing.json', 'data/audiobooks.json']
    for filename in filenames:
        with open(filename, 'r') as fp:
            dd = json.load(fp)
            if isinstance(dd, list):
                dd = dd[0]
            out.append(dd)
    return out


@industry_summary_router.post("/api/industry-summary", response_model=DataModelOut)
async def industry_summary_for_thesis(request: DataModelIn):
    """Returns industry summary based on the source (IBIS to start with)."""
    data = request.data
    source, name, code = data.source, data.industry_name, data.industry_code
    assert source == 'IBIS'
    industry_names = ibis_industries(code, name)
    assert industry_names

    summaries = mock_summaries()
    if len(summaries) < len(industry_names):
        summaries = len(industry_names) * summaries

    result = []
    for i, industry_name in enumerate(industry_names):
        assert industry_name
        result.append(summaries[i])

    return DataModelOut(result=result)
