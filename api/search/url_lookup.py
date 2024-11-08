"""Looking up URL's for companies to start with."""

import search.bing_search as bing_search
from urllib.parse import urlparse
from datetime import timedelta

from cachier import cachier

CACHE_FLUSH_WEEKS = 8


@cachier(stale_after=timedelta(weeks=CACHE_FLUSH_WEEKS))
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


def extract_domain(url: str) -> str:
    """Extracts the domain (2 last parts of the server in the URL)."""
    parsed = urlparse(url)
    netloc = parsed.netloc
    return '.'.join(netloc.split('.')[-2:])
