"""Tests for industry summary functionality."""

import asyncio

from api.api_industry_summary import Industry, DataModelIn, DataModelOut, industry_summary_for_thesis
from api.api_industry_summary import summary_for_name


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


def test_summary_for_name1():
    name = 'Audio Production Studios in the US.pdf'
    result = summary_for_name(name)
    keys = list(result.keys())
    assert 'report_title' in keys
    assert 'future_outlook' in keys


def test_summary_for_name2():
    name = 'Non-existent report.pdf'
    result = summary_for_name(name)
    keys = list(result.keys())
    assert not 'report_title' in keys
    assert not 'future_outlook' in keys
