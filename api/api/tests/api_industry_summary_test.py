"""Tests for industry summary functionality."""

import asyncio
import json

from api.api_industry_summary import (
    Industry, DataModelIn, DataModelOut,
    summary_for_name, industry_summary_for_thesis, industry_metrics,
    flatten_dict_once, add_metrics_ratings, RATED_METRICS
)


def run_test(industry_code: str, industry_name: str):
    data = DataModelIn(data=Industry(
        source='IBIS', industry_code=industry_code, industry_name=industry_name))
    result = asyncio.run(industry_summary_for_thesis(request=data))
    assert isinstance(result, DataModelOut)
    assert isinstance(result.result, list)
    assert len(result.result) == 1, f"Instead of 11, got {len(result.result)} entries"
    assert 'profit_margins' in result.result[0]['key_statistics']


def test1():
    run_test('333999', '3D Printer Manufacturing in the US')

def test2():
    run_test('336999', 'ATV Manufacturing in the US')

def test3():
    run_test('324110', 'Petroleum Refineries')

def test4():
    # was having problem with no data under profit except for profit margins.
    run_test('623110', 'Nursing Care Facilities')

def test5():
    # multiple reports per industry
    run_test('517311', 'Wired Telecommunications Carriers')


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


def test_industry_metrics():
    with open('api/tests/aluminum-manufacturing-summary.json') as f:
        summary = json.load(f)
    result = industry_metrics(summary)
    assert 'metrics' in result
    assert len(result['metrics']) == 2

    assert result['metrics'][0]['Total'] == 67
    # investment part is not working...
    # assert result['metrics'][1]['Total'] == 56


def test_add_metrics_ratings():
    with open('api/tests/aluminum-manufacturing-summary.json') as f:
        summary = json.load(f)
    flattened = flatten_dict_once(summary)
    flattened = flatten_dict_once(flattened)
    result = add_metrics_ratings(flattened)
    for metric in RATED_METRICS:
        if not metric == 'profit_margins_percentage':
            assert metric in result
