from fastapi import APIRouter, HTTPException
from utils.url_finder import find_crunchbase_url
from utils.content_fetcher import extract_crunchbase_url
from firecrawl import FirecrawlApp

router = APIRouter()

firecrawl_app = FirecrawlApp(api_key='fc-f0b5a990147f4ae88364925cd0dee335')

@router.post("/fetch-crunchbase-profile/")
async def fetch_crunchbase_url(company_name: str):
    link = await find_crunchbase_url(company_name)
    if not link:
        raise HTTPException(status_code=404, detail="Crunchbase URL not found.")

    extracted_url = extract_crunchbase_url(link)
    if not extracted_url:
        raise HTTPException(status_code=404, detail="No valid URL extracted.")

    response = firecrawl_app.scrape_url(url=extracted_url, params={
        'formats': ['markdown'],
    })

    return {
        "company_name": company_name,
        "crunchbase_url": extracted_url,
        "scrape_response": response
    }