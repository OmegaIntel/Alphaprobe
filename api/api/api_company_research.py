import os
import logging
import re
from fastapi import APIRouter, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from api.agent.graph import graph  # Import the graph directly
from api.agent.configuration import Configuration

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)

# Access environment variables
tavily_api_key = os.getenv("TAVILY_API_KEY")
anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")

research_router = APIRouter()

class CompanyResearchService:
    def __init__(self, anthropic_api_key: str, tavily_api_key: str):
        # Set up configuration
        self.config = Configuration(
            max_search_queries=5,
            max_search_results=5,
            max_reflection_steps=1
        )
        
    async def research_company(
        self, 
        company: str, 
        extraction_schema: dict = None,
        user_notes: str = None
    ):
        # Prepare input state
        input_data = {
            "company": company,
            "extraction_schema": extraction_schema,
            "user_notes": user_notes
        }
        
        # Execute the graph directly
        try:
            result = await graph.ainvoke(
                input_data,
                {"configurable": self.config.__dict__}
            )
            logging.info(f"Research Result: {result}")
            return result  # Return extracted information
        except Exception as e:
            logging.error(f"Error during graph.ainvoke: {e}")
            raise

# Initialize the research service
researcher = CompanyResearchService(
    anthropic_api_key=anthropic_api_key,
    tavily_api_key=tavily_api_key
)

class CompanyNameRequest(BaseModel):
    company_name: str

def validate_extraction_schema(schema: dict):
    KEY_PATTERN = re.compile(r'^[a-zA-Z0-9_-]{1,64}$')
    properties = schema.get("properties", {})
    for key in properties.keys():
        if not KEY_PATTERN.match(key):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid property key: '{key}'. Must match pattern '^[a-zA-Z0-9_-]{{1,64}}$'"
            )

@research_router.post("/api/research")
async def research_company(request: CompanyNameRequest):
    extraction_schema = {
        "title": "CompanyInfo",
        "description": "Basic information about a company",
        "type": "object",
        "properties": {
            "company_name": {
                "type": "string",
                "description": "Official name of the company"
            },
            "founding_year": {
                "type": "integer",
                "description": "Year the company was founded"
            },
            "product_description": {
                "type": "string",
                "description": "Brief description of the company's main product or service"
            },
            "company_description": {
                "type": "string",
                "description": "Detailed description of the company"
            },
            "company_headquarter_location": {
                "type": "string",
                "description": "Location of the company's headquarters"
            },
            "company_incorporation_date": {
                "type": "string",
                "description": "Date when the company was incorporated",
                "format": "date"
            },
            "company_website": {
                "type": "string",
                "description": "URL of the company's website",
                "format": "uri"
            },
            "company_employee_count": {
                "type": "string",
                "description": "Employee count range for the company"
            },
            "company_phone_number": {
                "type": "string",
                "description": "Company contact phone number"
            },
            "company_ownership_status": {
                "type": "string",
                "description": "Ownership status of the company"
            },
            "company_investors": {
                "type": ["string", "null"],
                "description": "Investors in the company"
            },
            "company_structure": {
                "type": "string",
                "description": "Legal or operational structure of the company"
            },
            "company_competitors": {
                "type": "array",
                "description": "List of competitors",
                "items": {
                    "type": "string"
                }
            },
            "company_contact_email": {
                "type": "string",
                "description": "Contact email for the company",
                "format": "email"
            },
            "company_linkedin_url": {
                "type": "string",
                "description": "LinkedIn URL of the company",
                "format": "uri"
            },
            "company_product1_name": {
                "type": "string",
                "description": "Name of the company's first product"
            },
            "company_product1_description": {
                "type": "string",
                "description": "Description of the company's first product"
            },
            "company_product2_name": {
                "type": "string",
                "description": "Name of the company's second product"
            },
            "company_product2_description": {
                "type": "string",
                "description": "Description of the company's second product"
            },
            "company_product3_name": {
                "type": "string",
                "description": "Name of the company's third product"
            },
            "company_product3_description": {
                "type": "string",
                "description": "Description of the company's third product"
            },
            "company_product4_name": {
                "type": "string",
                "description": "Name of the company's fourth product"
            },
            "company_product4_description": {
                "type": "string",
                "description": "Description of the company's fourth product"
            },
            "company_primary_industry": {
                "type": "string",
                "description": "The primary industry the company operates in"
            },
            "company_industry_verticals": {
                "type": "array",
                "description": "Industry verticals the company serves",
                "items": {
                    "type": "string"
                }
            },
            "company_ceo": {
                "type": "string",
                "description": "Name of the company's CEO"
            },
            "company_founder": {
                "type": "array",
                "description": "List of the company's founders",
                "items": {
                    "type": "string"
                }
            },
            "company_revenue": {
                "type": "string",
                "description": "Revenue range of the company"
            },
            "company_gross_margin": {
                "type": ["string", "null"],
                "description": "Gross margin information for the company"
            },
            "company_total_funding": {
                "type": "string",
                "description": "Total funding amount raised by the company"
            },
            "company_last_funding_date": {
                "type": "string",
                "description": "Date of the last funding event",
                "format": "date"
            },
            "company_future_projections": {
                "type": ["string", "null"],
                "description": "Future projections for the company"
            }
        },
        "required": [
            "company_name",
            "founding_year",
            "product_description",
            "company_description",
            "company_headquarter_location",
            "company_incorporation_date",
            "company_website",
            "company_employee_count",
            "company_phone_number",
            "company_ownership_status",
            "company_investors",
            "company_structure",
            "company_competitors",
            "company_contact_email",
            "company_linkedin_url",
            "company_product1_name",
            "company_product1_description",
            "company_product2_name",
            "company_product2_description",
            "company_product3_name",
            "company_product3_description",
            "company_product4_name",
            "company_product4_description",
            "company_primary_industry",
            "company_industry_verticals",
            "company_ceo",
            "company_founder",
            "company_revenue",
            "company_gross_margin",
            "company_total_funding",
            "company_last_funding_date",
            "company_future_projections"
        ]
    }
    
    user_notes = "Please extract and validate the company details."

    # Validate the extraction schema
    validate_extraction_schema(extraction_schema)

    try:
        # Execute the graph directly
        result = await researcher.research_company(
            company=request.company_name,
            extraction_schema=extraction_schema,
            user_notes=user_notes
        )
    except Exception as e:
        logging.error(f"Error during research_company invocation: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

    # Check if result is a dict or Pydantic model
    if isinstance(result, dict):
        return result
    elif hasattr(result, 'dict') and callable(result.dict):
        return result.dict()
    else:
        logging.error("Result is neither a dict nor a Pydantic model.")
        raise HTTPException(status_code=500, detail="Invalid response format from research_company.")