import uvicorn
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
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
from api.api_generate_pdf import pdf_report_router
from api.api_documents import upload_doc_router
from api.api_projects import project_router
from api.api_perplexity_research import perplexity_router
from api.api_langgraph_doc import langgraph_router
from api.api_langflow import langflow_router
# from api.api_deep_research import deep_research_router
from websocket_manager import WebSocketManager
from utils.websocket_utils import handle_websocket_communication
from api.api_deep_researcher import research_deep_router


app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")

# WebSocket manager
manager = WebSocketManager()

# Middleware
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


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await handle_websocket_communication(websocket, manager)
    except WebSocketDisconnect:
        await manager.disconnect(websocket)


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
app.include_router(pdf_report_router)
app.include_router(upload_doc_router)
app.include_router(project_router)
app.include_router(langgraph_router)
app.include_router(perplexity_router)
app.include_router(langflow_router)
app.include_router(research_deep_router)
# app.include_router(deep_research_router)

if __name__ == "__main__":
    uvicorn.run("api.app:app", host="0.0.0.0", port=8000, reload=True, loop="asyncio")
