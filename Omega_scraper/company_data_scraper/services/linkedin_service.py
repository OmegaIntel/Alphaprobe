from fastapi import APIRouter, HTTPException
from utils.url_finder import find_linkedin_url
from utils.content_fetcher import extract_linkedin_url
import subprocess
import json

router = APIRouter()

@router.post("/linkedin-company-profile")
async def get_company_profile(company_name: str):
    url_str = await find_linkedin_url(company_name)
    company_urls = extract_linkedin_url(url_str)

    if not company_urls:
        raise HTTPException(status_code=404, detail="LinkedIn URL not found")

    subprocess.run(["scrapy", "crawl", "company_profile_scraper", "-a", f"urls={json.dumps(company_urls)}", "-O", "company_profile_data.json"])

    try:
        with open("company_profile_data.json") as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Failed to retrieve company profile data")