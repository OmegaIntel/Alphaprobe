"""Returns industry summary in response to UI request. Starts with IBIS."""

from fastapi import APIRouter
from pydantic import BaseModel
from s3_tools.objects.read import read_object_to_text

from typing import List, Dict

import pandas as pd

from doc_parser.pdf_utils import doc_id
from doc_parser.doc_utils import dict_from_summary_json, flatten_dict_once


import logging
logging.basicConfig(
    filename='summary.log',
    encoding='utf-8',
    filemode='a',
    format="{asctime} - {levelname} - {message}",
    style="{",
    datefmt="%Y-%m-%d %H:%M:%S",
    level=logging.INFO
)

loginfo = logging.info

# for testability
from dotenv import load_dotenv
load_dotenv()

S3_STORAGE_BUCKET = 'omega-intel-doc-storage'
IBIS_SUMMARY_ROOT = 'Summaries/IBIS-reports'


IBIS_MAP_FILENAME = 'api/data/IBIS NAICS Code mapping.csv'
IBIS_REPORT_NAME = 'IBIS Report Name'
NAICS_CODE = 'NAICS Code'
IBIS_MAP = pd.read_csv(IBIS_MAP_FILENAME)
IBIS_MAP[NAICS_CODE] = IBIS_MAP[NAICS_CODE].apply(str)

MARKET_WEIGHTS = pd.read_csv('api/data/market-weights.csv')
INVESTMENT_WEIGHTS = pd.read_csv('api/data/investment-weights.csv')
CATEGORY_SCORES = pd.read_csv('api/data/category-scores.csv')
RATINGS_THRESHOLDS = pd.read_csv('api/data/ratings-thresholds.csv')


def ibis_industries(code: str, name: str) -> List[str]:
    """Use primarily code. If not found, use heuristics."""
    code = str(code)
    rows = IBIS_MAP[IBIS_MAP[NAICS_CODE] == code].copy()
    names = list(rows[IBIS_REPORT_NAME])
    if names:
        return names
    loginfo(f"The industry code was not mapped into a report {code}")
    return [name]


def summary_for_name(name: str) -> Dict:
    """Return summary from S3 if it exists, else return None."""
    doc_path = f'{IBIS_SUMMARY_ROOT}/{doc_id(name)}/section_summaries.json'
    try:
        text = read_object_to_text(S3_STORAGE_BUCKET, doc_path)
        return dict_from_summary_json(text)
    except:
        loginfo(f"The desired summary does not exist: {doc_path}")
        return {}
    

def add_metric_rating(summary: Dict, metric: str) -> Dict:
    """Convert metric value to metric raging (Low/High) and add it to the summary"""



def industry_metric_for_weights(summary: Dict, weights: pd.DataFrame) -> Dict:
    """Compute metrics based on the summary dictionary."""
    FIELD = 'JSON Field'
    TOTAL = 'Total'
    flattened = flatten_dict_once(summary)
    flattened = flatten_dict_once(flattened)
    dfm = pd.merge(weights, CATEGORY_SCORES)
    fields = list(weights[FIELD].unique())

    for_ddf = []
    for field in fields:
        if field in flattened:
            value = flattened[field]
            for_ddf.append({FIELD: field, 'Result': value})

    ddf = pd.DataFrame(for_ddf)
    total = pd.merge(dfm, ddf)
    total[TOTAL] = total['Weight'] * total['Score'] / 5
    del total[FIELD]
    out = {}
    out['Scores'] = total.to_dict(orient='records')
    out[TOTAL] = total[TOTAL].sum()
    return out


def industry_metrics(summary: Dict) -> Dict:
    """The metrics side of things."""
    out = []

    elt = {'Aspect': 'Market'}
    elt.update(industry_metric_for_weights(summary, MARKET_WEIGHTS))
    out.append(elt)

    elt = {'Aspect': 'Investments'}
    elt.update(industry_metric_for_weights(summary, INVESTMENT_WEIGHTS))
    out.append(elt)

    return {'metrics': out}


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

    summaries = []
    for name in industry_names:
        summary = summary_for_name(name)
        if not summary: continue
        metrics = industry_metrics(summary)
        summary.update(metrics)
        summaries.append(summary)

    return DataModelOut(result=summaries)
