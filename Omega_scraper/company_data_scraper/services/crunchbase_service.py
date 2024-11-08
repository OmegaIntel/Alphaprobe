from fastapi import APIRouter, HTTPException
from utils.url_finder import find_crunchbase_url
from utils.content_fetcher import extract_crunchbase_url
from firecrawl import FirecrawlApp

# Create a new APIRouter instance for defining API routes
router = APIRouter()

# Initialize the FirecrawlApp with the API key for web scraping
firecrawl_app = FirecrawlApp(api_key='fc-f0b5a990147f4ae88364925cd0dee335')

@router.post("/fetch-crunchbase-profile/")
async def fetch_crunchbase_url(company_name: str):
    """
    Fetch the Crunchbase profile for the specified company name.

    Parameters:
    - company_name (str): The name of the company whose Crunchbase profile is to be fetched.

    Returns:
    - dict: A dictionary containing the company name, the extracted Crunchbase URL, and the scrape response data.
    Raises HTTPException for 404 if the Crunchbase URL is not found or if no valid URL is extracted.
    """
    # Asynchronously find the Crunchbase URL for the provided company name
    link = await find_crunchbase_url(company_name)
    if not link:
        # Raise a 404 error if the Crunchbase URL could not be found
        raise HTTPException(status_code=404, detail="Crunchbase URL not found.")

    # Extract the valid Crunchbase URL from the found link
    extracted_url = extract_crunchbase_url(link)
    if not extracted_url:
        # Raise a 404 error if no valid URL was extracted from the found link
        raise HTTPException(status_code=404, detail="No valid URL extracted.")

    # Scrape the content from the extracted URL using the FirecrawlApp
    response = firecrawl_app.scrape_url(url=extracted_url, params={
        'formats': ['markdown'],  # Specify the desired format for the scraped content
    })

    # Return the company name, the extracted Crunchbase URL, and the response from the scraping
    return {
        "company_name": company_name,
        "crunchbase_url": extracted_url,
        "scrape_response": response
    }
