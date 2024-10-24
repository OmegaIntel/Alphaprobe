"""Tests for industry summary functionality."""

import asyncio

from api.api_industry_summary import Industry, DataModelIn, DataModelOut, industry_summary_for_thesis


def run_test(industry_code: str, industry_name: str, min_entries: int):
    data = DataModelIn(data=Industry(
        source='IBIS', industry_code=industry_code, industry_name=industry_name))
    result = asyncio.run(industry_summary_for_thesis(request=data))
    assert isinstance(result, DataModelOut)
    assert isinstance(result.result, list)
    assert len(result.result) >= min_entries



def test1():
    run_test('333999', '3D Printer Manufacturing in the US', 1)


def test2():
    run_test('336999', 'ATV Manufacturing in the US', 2)
