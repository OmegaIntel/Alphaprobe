from fastapi import APIRouter, HTTPException
from models.request_models import CompanyRequest
from utils.url_finder import find_owler_url
from utils.content_fetcher import fetch_content

router = APIRouter()

@router.post("/pitchbook_company_profile")
async def fetch_company_info(request: CompanyRequest):
    company_name = request.company_name
    url = await find_owler_url(company_name)

    if not url:
        raise HTTPException(status_code=404, detail="Company URL not found")

    content = fetch_content(url)
    if not content:
        raise HTTPException(status_code=500, detail="Error fetching content from URL")

    return content