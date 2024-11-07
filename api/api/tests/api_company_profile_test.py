from api.api_company_profile import get_company_provider_info, get_company_info

def test1():
    company_name = 'Vouched'
    provider = 'linkedin.com'

    result = get_company_provider_info(company_name, provider)
    print(result)


def test2():
    company_name = 'Vouched'
    provider = 'crunchbase.com'

    result = get_company_provider_info(company_name, provider)
    print(result)


def test_many():
    company_name = 'Vouched'
    result = get_company_info(company_name)
    for elt in result:
        print(elt)
