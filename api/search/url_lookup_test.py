from search.url_lookup import lookup_company_url, extract_domain

def test_vouched():
    name = 'Vouched'
    for site, expected in [
        ('linkedin.com', 'https://www.linkedin.com/company/vouched'),
        ('owler.com', 'https://www.owler.com/company/vouched'),
        ('crunchbase.com', 'https://www.crunchbase.com/organization/vouched-0c75'),
        ('pitchbook.com', 'https://pitchbook.com/profiles/company/264651-31'),
    ]:
        
        result = lookup_company_url(name, site)
        assert result == expected


def test_extract_domain():
    for domain, url in [
        ('linkedin.com', 'https://www.linkedin.com/company/vouched'),
        ('owler.com', 'https://www.owler.com/company/vouched'),
        ('crunchbase.com', 'https://www.crunchbase.com/organization/vouched-0c75'),
        ('pitchbook.com', 'https://pitchbook.com/profiles/company/264651-31'),
    ]:
        result = extract_domain(url)
        assert domain == result
