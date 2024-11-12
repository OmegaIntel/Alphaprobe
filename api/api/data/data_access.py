"""Access to the data pieces."""

from typing import List

import pandas as pd
from common_logging import loginfo


IBIS_MAP_FILENAME = 'api/data/IBIS NAICS Code mapping.csv'
IBIS_REPORT_NAME = 'IBIS Report Name'
NAICS_CODE = 'NAICS Code'
IBIS_MAP = pd.read_csv(IBIS_MAP_FILENAME)
IBIS_MAP[NAICS_CODE] = IBIS_MAP[NAICS_CODE].apply(str)

IBIS_NAICS_CODES: List[str] = list(IBIS_MAP[NAICS_CODE])
IBIS_REPORT_NAMES = list(IBIS_MAP[IBIS_REPORT_NAME])

def ibis_industries(code: str, name: str) -> List[str]:
    """Use primarily code. If not found, use heuristics."""
    code = str(code)
    rows = IBIS_MAP[IBIS_MAP[NAICS_CODE] == code].copy()
    names = list(rows[IBIS_REPORT_NAME])
    if names:
        return names
    loginfo(f"The industry code was not mapped into a report {code}")
    return [name]

# TODO: testing
