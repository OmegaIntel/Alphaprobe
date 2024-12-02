"""Returns industry summary in response to UI request. Starts with IBIS."""

from fastapi import APIRouter
from pydantic import BaseModel
from s3_tools.objects.read import read_object_to_text

from typing import List, Dict

import pandas as pd
import json

from doc_parser.pdf_utils import doc_id
from doc_parser.doc_utils import dict_from_summary_json, flatten_dict_once, extract_key_val_from_dict
from api.data.data_access import ibis_industries

from common_logging import loginfo

# for testability
from dotenv import load_dotenv
load_dotenv()

S3_STORAGE_BUCKET = 'omega-intel-doc-storage'
IBIS_SUMMARY_ROOT = 'Normalized_IBIS_Reports'


# IBIS_MAP_FILENAME = 'api/data/IBIS NAICS Code mapping.csv'
# IBIS_REPORT_NAME = 'IBIS Report Name'
# NAICS_CODE = 'NAICS Code'

MARKET_WEIGHTS = pd.read_csv('api/data/market-weights.csv')
INVESTMENT_WEIGHTS = pd.read_csv('api/data/investment-weights.csv')
CATEGORY_SCORES = pd.read_csv('api/data/category-scores.csv')

RATINGS_THRESHOLDS = pd.read_csv('api/data/ratings-thresholds.csv')
for cname in ['Upper', 'Lower']:
    RATINGS_THRESHOLDS[cname] = RATINGS_THRESHOLDS[cname].astype(float)

FIELD = 'JSON Field'

with open('api/data/rated-metrics.json') as f:
    RATED_METRICS = json.load(f)


def profits_fixup(dd: dict) -> dict:
    """Fix up the issue with profits: if profit_margins is under profit, profit is erroneous, remove it."""
    KS = 'key_statistics'
    P = 'profit'
    PM = 'profit_margins'
    if KS in dd:
        if P in dd[KS]:
            if PM in dd[KS][P]:
                dd[KS][PM] = dd[KS][P][PM].copy()
                del dd[KS][P]
                loginfo("Fixed up profit margins")
    return dd


def summary_for_name(name: str) -> Dict:
    """Return summary from S3 if it exists, else return None."""
    doc_path = f'{IBIS_SUMMARY_ROOT}/{doc_id(name)}/section_summaries.json'
    try:
        text = read_object_to_text(S3_STORAGE_BUCKET, doc_path)
        out = dict_from_summary_json(text)
        out = profits_fixup(out)
        return out
    except:
        loginfo(f"The desired summary does not exist: {doc_path}")
        return {}
    

def add_metrics_ratings(flat_summary: Dict) -> Dict:
    """Convert metric value to metric raging (Low/High) and add it to the summary"""

    for metric_name, metric_key in RATED_METRICS.items():
        val = extract_key_val_from_dict(flat_summary, metric_key)

        # test that it's numeric
        try:
            float(val)
        except:
            continue

        rt = RATINGS_THRESHOLDS[RATINGS_THRESHOLDS[FIELD] == metric_name].copy()
        for dd in rt.to_dict(orient='records'):
            if dd['Lower'] <= val < dd['Upper']:
                flat_summary[metric_name] = dd['Rating']
                break
    return flat_summary


def industry_metric_for_weights(flattened: Dict, weights: pd.DataFrame) -> Dict:
    """Compute metrics based on the summary dictionary."""
    TOTAL = 'Total'
    dfm = pd.merge(weights, CATEGORY_SCORES)
    fields = list(weights[FIELD].unique())

    for_ddf = []
    for field in fields:
        if field in flattened:
            value = flattened[field]
            for_ddf.append({FIELD: field, 'Result': value})

    ddf = pd.DataFrame(for_ddf)
    total = pd.merge(dfm, ddf)
    MAX_RATING = 5
    total[TOTAL] = total['Weight'] * total['Score'] / MAX_RATING
    del total[FIELD]
    out = {}

    # normalize for the case when not all fields are populated
    MAX_TOTAL_WEIGHT = 100
    out['Scores'] = total.to_dict(orient='records')
    if total['Weight'].sum() == 0:
        out[TOTAL] = 0
    else:
        out[TOTAL] = total[TOTAL].sum() * (MAX_TOTAL_WEIGHT / total['Weight'].sum())

    return out


def industry_metrics(summary: Dict) -> Dict:
    """The metrics side of things."""
    out = []

    flattened = flatten_dict_once(summary)
    flattened = flatten_dict_once(flattened)
    flattened = add_metrics_ratings(flattened)

    elt = {'Aspect': 'Market'}
    elt.update(industry_metric_for_weights(flattened, MARKET_WEIGHTS))
    out.append(elt)

    elt = {'Aspect': 'Investments'}
    elt.update(industry_metric_for_weights(flattened, INVESTMENT_WEIGHTS))
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


def sorted_summaries(summaries: List[Dict]) -> List[Dict]:
    """Use a few functions to sort the summaries."""
    # TODO: testing

    def use_profit_margins(summary: dict):
        return summary['key_statistics']['profit_margins']

    def use_value_added(summary: dict):
        return summary['key_statistics']['industry_value_added']

    def use_employees(summary: dict):
        return summary['key_statistics']['employees']

    def use_report_title(summary: dict):
        return summary['report_title']
    
    def use_len(summary: dict):
        return len(summary)
    
    for func in [use_profit_margins, use_value_added, use_employees, use_report_title, use_len]:
        try:
            result = sorted(summaries, key=func, reverse=True)
            return result
        except (KeyError, TypeError):
            continue

    return summaries


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

    # take the first of the sorted summaries.
    summaries = sorted_summaries(summaries)[:1]
    return DataModelOut(result=summaries)
