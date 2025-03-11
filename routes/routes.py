from fastapi import APIRouter, HTTPException
from tools.analysis_tools import (
    web_search_tool,
    anthropic_tool,
    openai_api_tool,
    pdf_search_tool,
    deep_research_tool,
)
from tools.analysis_models import UserQuery
from db.db_create import process_pdf

router = APIRouter()


@router.get("/ping")
def read_root():
    return {"message": "Hello World"}


async def handle_tool_request(tool_function, user_query: UserQuery):
    try:
        result = await tool_function(user_query)
        return {"result": result["answer"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/web-search")
async def web_search(user_query: UserQuery):
    return await handle_tool_request(web_search_tool, user_query)


@router.get("/anthropic-api")
async def anthropic_api(user_query: UserQuery):
    return await handle_tool_request(anthropic_tool, user_query)


@router.get("/openai-api")
async def openai_api(user_query: UserQuery):
    return await handle_tool_request(openai_api_tool, user_query)


@router.get("/pdf-citation")
async def pdf_citation(user_query: UserQuery):
    return await handle_tool_request(pdf_search_tool, user_query)


@router.get("/upload-pdf")
def upload_pdf():
    pdf_files = [
        "pdf/1.pdf",
        "pdf/2.pdf",
        "pdf/3.pdf",
        "pdf/4.pdf",
        "pdf/5.pdf",
        "pdf/6.pdf",
    ]
    try:
        process_pdf(pdf_files)
        return {"result": "PDF upload success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/deep-research")
async def deep_research(user_query: UserQuery):
    return await handle_tool_request(deep_research_tool, user_query)
