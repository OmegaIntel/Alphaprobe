"""Tests for related industries functionality."""

import pandas as pd
from api.api_related_industries import (
    industries_for_thesis, UserQR, IndustryCode,
    DataModelIn, DataModelOut, IBIS_NAICS_CODES
)
import asyncio


def run_test(csv_name: str):
    """Run the test on the CSV"""
    df = pd.read_csv(csv_name)
    dfrs = df.to_dict(orient='records')

    uqrs = []
    for row in dfrs:
        uqrs.append(UserQR(question=row['Question'], response=row['Answer']))

    result = asyncio.run(industries_for_thesis(request=DataModelIn(data=uqrs)))
    
    assert isinstance(result, DataModelOut)
    assert isinstance(result.result, list)
    assert len(result.result) >= 5

    codes = set()
    for elt in result.result:
        assert isinstance(elt, IndustryCode)
        assert elt.industry_name
        assert elt.industry_code
        assert elt.industry_code in IBIS_NAICS_CODES
        codes.add(elt.industry_code)

    assert len(result.result) == len(codes)
    print(result.result)


def test1():
    run_test("api/tests/related-industries-qa-1.csv")


def test2():
    run_test("api/tests/related-industries-qa-2.csv")


def test3():
    run_test("api/tests/related-industries-qa-3.csv")
