"""Looking up URL's for companies to start with."""

import search.bing_search as bing_search

def lookup_company_url(company_name: str, site: str) -> str:
    """Looks up company url by its name on the site."""

    bs = bing_search.BingSearch()
    result = bs.search(f"{company_name} company profile site:{site}")
    try:
        candidates = result['webPages']['value']
        for candidate in candidates:
            if site in candidate['url']:
                return candidate['url']
    except:
        return ''
