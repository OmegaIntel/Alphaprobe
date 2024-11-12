import json
import subprocess
from uuid import uuid1
from os import unlink
from urllib.parse import urlparse, urlunparse
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncio
from url_finder import find_company_url
from content_scraper import fetch_content

# FastAPI app instance
app = FastAPI()

class CompanyRequest(BaseModel):
    company_name: str

def clean_url(url: str) -> str:
    """Helper function to clean and normalize the URL."""
    parsed_url = urlparse(url)
    netloc = parsed_url.netloc.replace("www.", "")
    return urlunparse((
        parsed_url.scheme if parsed_url.scheme else "https",  # Default to https
        netloc,
        parsed_url.path,
        parsed_url.params,
        parsed_url.query,
        parsed_url.fragment
    ))

async def company_profile_scraper(company_name: str, site: str):
    """ scraper function for LinkedIn and PitchBook."""
    # Find the company URL asynchronously
    company_url = await find_company_url(company_name, site)
    if not company_url:
        raise HTTPException(status_code=404, detail=f"Company URL for '{company_name}' on {site} not found.")
    
    # Clean the URL before using it
    company_url = clean_url(company_url)

    if site == "linkedin.com":
        # LinkedIn uses Scrapy
        temp_file = f"{uuid1()}.json"
        try:
            # Run Scrapy crawler
            urls_json = json.dumps([company_url])
            subprocess.run(
                ["scrapy", "crawl", "company_profile_scraper", "-a", f"urls={urls_json}", "-O", temp_file],
                check=True
            )
            with open(temp_file) as f:
                data = json.load(f)
            return data
        except (FileNotFoundError, subprocess.CalledProcessError) as e:
            raise HTTPException(status_code=500, detail=f"Failed to retrieve company profile data: {e}")
        finally:
            try:
                unlink(temp_file)
            except FileNotFoundError:
                pass

    elif site == "pitchbook.com":
        # PitchBook uses fetch_content
        try:
            data = await asyncio.to_thread(fetch_content, company_url)
            return data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to retrieve company profile data: {e}")

# Define the endpoints for each site
@app.post("/linkedin_company_profile/")
async def linkedin_company_profile(request: CompanyRequest):
    return await company_profile_scraper(request.company_name, "linkedin.com")

@app.post("/pitchbook_company_profile/")
async def pitchbook_company_profile(request: CompanyRequest):
    return await company_profile_scraper(request.company_name, "pitchbook.com")

