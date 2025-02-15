# app.py
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from api.api_user import user_router
from pydantic import ValidationError
from api.api_demo_requests import demo_request_router
from api.api_deals import deals_router
from api.api_news import new_router
from api.api_related_industries import related_industries_router
from api.api_industry_summary import industry_summary_router
from api.api_company_profile import company_profile_router
from api.api_search_fuzzy import search_router
from api.api_rag import rag_router
from api.api_related_companies import companies_router
from api.api_industry_search import search_industries_router
from api.api_research_report import document_router
from api.api_file_upload import upload_file_router
from api.api_amplitude import amplitude_router
from api.api_search_exp import exp_router
from api.api_gpt_researcher import gpt_router


app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

app.include_router(user_router)
app.include_router(demo_request_router)
app.include_router(deals_router)
app.include_router(document_router)
app.include_router(new_router)
app.include_router(related_industries_router)
app.include_router(industry_summary_router)
app.include_router(company_profile_router)
app.include_router(search_router)
app.include_router(rag_router)
app.include_router(companies_router)
app.include_router(search_industries_router)
app.include_router(upload_file_router)
app.include_router(amplitude_router)
app.include_router(exp_router)
app.include_router(gpt_router)

if __name__ == "__main__":
    uvicorn.run("api.app:app", host="0.0.0.0", port=8000, reload=True, loop='asyncio')
