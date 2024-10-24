"""Returns industry summary in response to UI request. Starts with IBIS."""

from fastapi import APIRouter
from pydantic import BaseModel
import json
import s3_tools
from s3_tools.objects.read import read_object_to_text

from typing import List, Dict

import pandas as pd

from doc_parser.pdf_utils import doc_id

# for testability
from dotenv import load_dotenv
load_dotenv()

S3_STORAGE_BUCKET = 'omega-intel-doc-storage'
IBIS_SUMMARY_ROOT = 'Summaries/IBIS-reports'


# Define the request and response models
class ChatRequest(BaseModel):
    query: str  # User's message
    chat_id: str  # The document context ID

class ChatResponse(BaseModel):
    response: str


IBIS_MAP_FILENAME = 'api/data/IBIS NAICS Code mapping.xlsx'
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


def summary_for_name(name: str) -> Dict:
    """Return summary from S3 if it exists, else return None."""
    doc_path = f'{IBIS_SUMMARY_ROOT}/{doc_id(name)}/section_summaries.json'
    if s3_tools.object_exists(S3_STORAGE_BUCKET, doc_path):
        text = read_object_to_text(S3_STORAGE_BUCKET, doc_path)
        result = json.loads(text)
        if isinstance(result, list):
            result = result[0]
    else:
        result = {}
    return result


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
    filenames = ['api/data/atv-manufacturing.json', 'api/data/audiobooks.json']
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
