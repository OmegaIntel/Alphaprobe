"""Returns company profile in response to UI request."""

from fastapi import APIRouter
from pydantic import BaseModel
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from datetime import timedelta

from typing import Dict
import requests

from cachier import cachier

from search.url_lookup import lookup_company_url, CACHE_FLUSH_WEEKS
from llm_models.openai_gpt.llm_response import respond_to_prompt
from common_logging import loginfo


SCRAPER_URL = 'http://scraper:8008' # the name is from Docker yaml
TIMEOUT = 15    # seconds max exec time per scraper

ENDPOINTS = {
    'linkedin.com': 'linkedin-company-profile',
    'crunchbase.com': 'crunchbase-company-profile',
    'owler.com': 'owler-company-profile',
    'pitchbook.com': 'pitchbook-company-profile',
}


df_attrs = pd.read_csv('api/data/company-profile-attributes.csv')
ATTRS = list(df_attrs['Name'])


@cachier(stale_after=timedelta(weeks=CACHE_FLUSH_WEEKS))
def get_company_url_provider_info(company_url: str, provider: str) -> str:
    """Gets info from the provider for the URL."""
    endpoint = ENDPOINTS[provider]
    response = requests.post(
        f'{SCRAPER_URL}/{endpoint}',
        json={'company_url': company_url},
    )
    return response.text


def get_company_provider_info(company_name: str, provider: str) -> str:
    """Gets company info from the provider."""
    assert provider in ENDPOINTS
    company_url = lookup_company_url(company_name, provider)
    return get_company_url_provider_info(company_url, provider)


@cachier(stale_after=timedelta(weeks=CACHE_FLUSH_WEEKS))
def get_company_info(company_name: str) -> Dict:
    """Get info from all providers, extracting attribute values."""
    company_names = [company_name for provider in ENDPOINTS]
    providers = list(ENDPOINTS.keys())
    try:
        # try to do them in parallel, but with one failing all fail
        with ThreadPoolExecutor(max_workers=len(ENDPOINTS)) as executor:
            result = list(executor.map(get_company_provider_info, company_names, providers, timeout=TIMEOUT))
            loginfo(f"One of the providers in {providers} timed out on {company_name}")
    except TimeoutError:
        result=[]
        # execute them one a time watching for exception
        for provider in providers:
            try:
                with ThreadPoolExecutor(max_workers=1) as executor:
                    result += list(executor.map(get_company_provider_info, [company_name], [provider], timeout=TIMEOUT))
            except TimeoutError:
                loginfo(f"Provider {provider} timed out on {company_name}")

    result = '\n\n'.join(result)

    prompt = f"""
You are trying to extract from text certain attributes for a company called "{company_name}".
You are first given a list of attributes to extract, in triple quotes.
You are also given the text that was scraped from several web pages.
Extract the values of the attributes for the company "{company_name}" in JSON format.
If there are several potential values for an attribute, use the first value.
If an attribute's value is not in the text, return Null for that attribute.
The result should be JSON with attribute names as keys.

'''
{ATTRS}
'''

'''
{result}
'''

"""
    
    processed = respond_to_prompt(prompt)
    return processed


class Industry(BaseModel):
    company_name: str

class DataModelIn(BaseModel):
    data: Industry


class DataModelOut(BaseModel):
    result: Dict


company_profile_router = APIRouter()

@company_profile_router.post('/api/company-profile', response_model=DataModelOut)
async def company_profile(request: DataModelIn):
    """Returns company profile based on several sources."""
    data = request.data
    company_name = data.company_name
    profile = get_company_info(company_name)
    return DataModelOut(result=profile)
