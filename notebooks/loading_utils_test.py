from loading_utils import new_lines_to_list, get_initial_pages


def test_new_lines_to_list():

    dd = {
        "source": "IBIS",
        "type": "Industry research",
        "subtype": "Industry at a Glance",
        "industry_name": "Household Furniture Manufacturing",
        "last_updated": "2023-12-13T00:00:00+00:00",
        "industry_summary": {
            "industry_definition": "The industry manufactures a range of furniture for personal, household and public use. Furniture may be made on a stock or custom basis and may be sold assembled or unassembled.",
            "swot_analysis": {
            "strengths": "Low customer class concentration. Low capital requirements.",
            "weaknesses": "Low & steady level of assistance. High competition. Decline life cycle stage. High imports. Low profit vs sector average. High product/service concentration. Low revenue per employee.",
            "opportunities": "High revenue growth (2023-2028). High performance drivers: Per capita disposable income.",
            "threats": "Very low revenue growth (2005-2023). Low revenue growth (2018-2023). Low outlier growth. Import penetration into the manufacturing sector."
            },
            "key_trends": "- Prominent import penetration harms domestic manufacturers as lower production costs overseas enable foreign producers to offer more affordable furniture.\n- Losses in the residential market amid elevated inflation and high interest rates result in falling revenue as consumers postpone large purchases.\n- The expected depreciation of the US dollar is likely to boost revenue growth by making domestic furniture more affordable, although growth will be slow due to unfavorable economic conditions.\n- Housing starts and existing home sales fall amid macroeconomic conditions, harming manufacturers as consumers tend to purchase new furniture when moving.\n- Manufacturers face various environmental regulations that increase operating costs.",
        }
    }

    # new_lines_to_list
    assert isinstance(dd['industry_summary']['key_trends'], str)
    res = new_lines_to_list(dd)
    assert isinstance(dd['industry_summary']['key_trends'], list)


def test_initial_pdf_pages():
    filename = 'IndustrySource/Misc/study_id66974_in-depth-report-industry-40.pdf'
    pmax=20
    result = get_initial_pages(filename, pmax=pmax)
    print(result)
