"""Returns company profile in response to UI request."""

from fastapi import APIRouter
from pydantic import BaseModel
import pandas as pd
from concurrent.futures import ThreadPoolExecutor

from typing import Dict
import requests

from search.url_lookup import lookup_company_url
from llm_models.openai_gpt.llm_response import respond_to_prompt

import logging
logging.basicConfig(
    filename='summary.log',
    encoding='utf-8',
    filemode='a',
    format="{asctime} - {levelname} - {message}",
    style="{",
    datefmt="%Y-%m-%d %H:%M:%S",
    level=logging.INFO
)

loginfo = logging.info

SCRAPER_URL = 'http://localhost:8401'
ENDPOINTS = {
    'linkedin.com': 'linkedin-company-profile',
    'crunchbase.com': 'crunchbase-company-profile',
    'owler.com': 'owler-company-profile',
    'pitchbook.com': 'pitchbook-company-profile',
}


df_attrs = pd.read_csv('api/data/company-profile-attributes.csv')
ATTRS = list(df_attrs['Name'])

def get_company_provider_info(company_name: str, provider: str) -> Dict:
    """Gets info from the provider."""
    assert provider in ENDPOINTS
    url = lookup_company_url(company_name, provider)
    endpoint = ENDPOINTS[provider]
    response = requests.post(
        f'{SCRAPER_URL}/{endpoint}',
        json={'company_url': url},
    )
    return response.text


def get_company_info(company_name: str) -> Dict:
    """Get info from all providers"""
    company_names = [company_name for provider in ENDPOINTS]
    providers = list(ENDPOINTS.keys())
    with ThreadPoolExecutor(max_workers=4) as executor:
        result = list(executor.map(get_company_provider_info, company_names, providers, timeout=40))

    prompt = f"""
We are trying to extract from text certain attributes for a company called "{company_name}".
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
