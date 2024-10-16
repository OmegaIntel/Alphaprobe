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


def test2():
    filename = 'test-data/related-industries-1.csv'
    df = pd.read_csv(filename)
    rows = df.to_dict(orient='records')
    result = matching_industry_names_codes_from_qa(rows)
    print("RESULT")
    print(result)
