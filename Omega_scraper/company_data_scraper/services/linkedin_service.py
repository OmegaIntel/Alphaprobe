from fastapi import APIRouter, HTTPException
from utils.url_finder import find_linkedin_url
from utils.content_fetcher import extract_linkedin_url
import subprocess
import json

# Create a new APIRouter instance for defining API routes
router = APIRouter()

@router.post("/linkedin-company-profile")
async def get_company_profile(company_name: str):
    """
    Fetch the LinkedIn company profile based on the provided company name.

    Parameters:
    - company_name (str): The name of the company for which the LinkedIn profile is to be fetched.

    Returns:
    - dict: The extracted company profile data from LinkedIn.
    Raises HTTPException for 404 if the LinkedIn URL is not found or 500 if data retrieval fails.
    """
    # Asynchronously find the LinkedIn URL for the provided company name
    url_str = await find_linkedin_url(company_name)
    # Extract the LinkedIn URLs from the retrieved URL string
    company_urls = extract_linkedin_url(url_str)

    if not company_urls:
        # Raise a 404 error if no LinkedIn URL could be extracted
        raise HTTPException(status_code=404, detail="LinkedIn URL not found")

    # Run the Scrapy spider to crawl the company profile using the extracted URLs
    subprocess.run(["scrapy", "crawl", "company_profile_scraper", "-a", f"urls={json.dumps(company_urls)}", "-O", "company_profile_data.json"])

    try:
        # Attempt to open and load the scraped company profile data from the JSON file
        with open("company_profile_data.json") as f:
            data = json.load(f)
        return data  # Return the loaded data as a response
    except FileNotFoundError:
        # Raise a 500 error if the JSON file is not found, indicating a failure in data retrieval
        raise HTTPException(status_code=500, detail="Failed to retrieve company profile data")
