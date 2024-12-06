import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import json

# Define the FastAPI router
companies_router = APIRouter()

# Pydantic model for API response
class CompaniesResponse(BaseModel):
    companies: List[str]


def fetch_companies(query: str) -> List[str]:
    """
    Fetches the top private companies related to the query from Perplexity API.
    """
    import re

    api_url = "https://api.perplexity.ai/chat/completions"
    api_key = "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"  # Replace with your actual API key

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    prompt = (
        f"List the top 6 private companies related to: {query}. "
        f"Provide the response in the following JSON format: "
        f'{{"companies": ["Company Name 1", "Company Name 2", "Company Name 3", "Company Name 4", "Company Name 5", "Company Name 6"]}}.'
    )

    payload = {
        "model": "llama-3.1-sonar-small-128k-online",
        "messages": [
            {"role": "system", "content": "Provide concise and structured information in JSON format."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 150,
        "temperature": 0.2,
        "top_p": 0.9,
        "stream": False
    }

    try:
        response = requests.post(api_url, headers=headers, json=payload)

        if response.status_code != 200 or response.headers.get("Content-Type") != "application/json":
            raise HTTPException(status_code=500, detail="Failed to fetch data from Perplexity API")

        data = response.json()
        choices = data.get("choices", [])
        if not choices or "message" not in choices[0]:
            raise HTTPException(status_code=500, detail="Unexpected API response format")

        content = choices[0]["message"].get("content", "{}")
        clean_content = content.replace("```json", "").replace("```", "").strip()

        # Extract JSON using regex
        json_match = re.search(r"(\{.*?\})", clean_content, re.DOTALL)
        if not json_match:
            raise HTTPException(status_code=500, detail="No valid JSON found in the response")

        valid_json = json_match.group(1)  # Extract JSON block

        # Parse the JSON block
        response_data = json.loads(valid_json)  # Safely parse JSON
        return response_data.get("companies", [])

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Error parsing JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {e}")




# API endpoint
@companies_router.get("/api/companies", response_model=CompaniesResponse)
async def get_companies(query: str):
    """
    API endpoint to fetch the top private companies for a given query.
    """
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required.")

    companies = fetch_companies(query)
    return CompaniesResponse(companies=companies)
