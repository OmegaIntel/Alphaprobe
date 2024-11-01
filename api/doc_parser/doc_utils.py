"""Misc utils"""

import json
from typing import List, Dict, Union


def dict_from_summary_json(text: str) -> Dict:
    """Convert text in the JSON file to dict."""
    result = json.loads(text)
    if isinstance(result, dict):
        return result
    if isinstance(result, list):
        out = {}
        for dd in result:
            assert isinstance(dd, dict)
            out.update(dd)
        return out
    return {}


def flatten_dict_once(dd: Dict) -> Dict:
    """Flatten the dict by 1 level."""
    ddc = dd.copy()
    for val in dd.values():
        if isinstance(val, dict):
            ddc.update(val)
    return ddc


def extract_key_val_from_dict(dd: Union[Dict, List], key: str):
    """Extracts from the dictionary or list of dictionaries the value(s) referenced by the key"""
    # The key can be composite: 'revenue_cagr_projected.revenue_cagr_value'
    # if dd is a list of dictionaries, returns the max of the list of referenced values or 0 if list is empty.
    sep = '.'
    if not sep in key:
        if isinstance(dd, dict):
            return dd.get(key, None)
        if isinstance(dd, list):
            extracted = [extract_key_val_from_dict(elt, key) for elt in dd]
            extracted = [elt for elt in extracted if elt is not None]
            return max(extracted, default=0)
        if isinstance(dd, str):
            try:
                dd = json.loads(dd)
                return extract_key_val_from_dict(dd, key)
            except:
                return None
    arr = key.split(sep)
    first_key = arr[0]
    rest_key = sep.join(arr[1:])
    assert isinstance(dd, Dict), f'{dd} not a Dict'
    if not first_key in dd:
        return None
    dd1 = dd[first_key]
    return extract_key_val_from_dict(dd1, rest_key)
