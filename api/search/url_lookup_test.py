from search.url_lookup import lookup_company_url

def test_vouched():
    name = 'Vouched'
    # note: pitchbook does not have it
    sites = ['linkedin.com', 'owler.com', 'crunchbase.com']
    for site in sites:
        assert name.lower() in lookup_company_url(name, site), f'{name.lower()} not found in {site}'

    other_sites = ['pitchbook.com']
    for site in other_sites:
        assert lookup_company_url(name, site), f'Did not lookup {name} not found in {site}'
