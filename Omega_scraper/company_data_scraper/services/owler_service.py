from fastapi import APIRouter, HTTPException
from models.request_models import CompanyRequest
from utils.url_finder import find_owler_url
from utils.content_fetcher import fetch_content

# Create a new APIRouter instance for defining API routes
router = APIRouter()

@router.post("/owler_company_profile")
async def fetch_company_info(request: CompanyRequest):
    """
    Fetch company information from Owler based on the company name provided in the request.

    Parameters:
    - request (CompanyRequest): The request model containing the company name.

    Returns:
    - dict: The content fetched from the company's Owler profile or raises an HTTPException.
    """
    company_name = request.company_name  # Extract company name from the request
    url = await find_owler_url(company_name)  # Asynchronously find the Owler URL for the company

    if not url:
        # Raise a 404 error if the company URL could not be found
        raise HTTPException(status_code=404, detail="Company URL not found")

    content = fetch_content(url)  # Fetch the content from the found Owler URL
    if not content:
        # Raise a 500 error if there was an issue fetching the content
        raise HTTPException(status_code=500, detail="Error fetching content from URL")

    return content  # Return the fetched content as a response
