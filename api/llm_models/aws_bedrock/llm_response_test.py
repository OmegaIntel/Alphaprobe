import pandas as pd
from llm_models.aws_bedrock.llm_response import extract_basic_info, matching_industry_names_codes_from_qa


def test1():

    filename = 'test-data/study_id66974_in-depth-report-industry-40.pdf'
    result = extract_basic_info(filename)

    expected = {
        'title': 'Industry 4.0: in-depth market analysis',
        'source': 'Market Insights report',
        'last_updated': 'March 2024'
    }
    assert result == expected


def basic_related_industries_test(filename: str):
    df = pd.read_csv(filename)
    rows = df.to_dict(orient='records')
    result = matching_industry_names_codes_from_qa(rows)
    assert 'industry_name_code' in result
    assert len(result['industry_name_code']) >= 5
    for entry in result['industry_name_code']:
        assert 'industry_name' in entry
        assert 'industry_code' in entry

def test2_1():
    filename = 'test-data/related-industries-1.csv'
    basic_related_industries_test(filename)

def test2_2():
    filename = 'test-data/related-industries-2.csv'
    basic_related_industries_test(filename)
