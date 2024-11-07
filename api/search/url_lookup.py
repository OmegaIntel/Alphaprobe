"""Looking up URL's for companies to start with."""

import search.bing_search as bing_search


def lookup_company_url(company_name: str, site: str) -> str:
    """Looks up company url by its name on the site."""
    # TODO: think if we want to retain multiple URL's for better results.

    # TODO: cleanup the code in bing_search.
    bs = bing_search.BingSearch()
    result = bs.search(f"{company_name} company profile site:{site}")
    try:
        candidates = result['webPages']['value']
        for candidate in candidates:
            if site in candidate['url']:
                return candidate['url']
    except:
        return ''
