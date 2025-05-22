import logging_config
import uvicorn
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from api.apis.api_verify_user import verify_user_router
from api.apis.api_generate_token import user_generate_token_router
from api.apis.api_register_user import user_register_router
from api.apis.api_get_current_user import current_user_router
from pydantic import ValidationError
from apis.api_generate_pdf import pdf_report_router
from apis.api_projects import project_router
from websocket_manager import WebSocketManager
from utils.websocket_utils import handle_websocket_communication
from api.apis.api_create_deep_researcher import create_research_deep_router
from api.apis.api_update_deep_researcher import update_deep_researcher_router
from api.apis.api_upload_deep_research_files import deer_research_upload_files_router
from api.apis.api_get_project_list import project_list_router
from api.apis.api_get_reports import reports_router
from api.apis.api_upload_outline_file import upload_outline_file_router
from apis.api_kb_search import aws_kb_router
from apis.api_graph_update import update_graph_router


import logging

logger = logging.getLogger(__name__)


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


app.include_router(verify_user_router)
app.include_router(user_generate_token_router)
app.include_router(user_register_router)
app.include_router(current_user_router)
app.include_router(pdf_report_router)
app.include_router(project_router)
app.include_router(create_research_deep_router)
app.include_router(aws_kb_router)
app.include_router(update_deep_researcher_router)
app.include_router(deer_research_upload_files_router)
app.include_router(project_list_router)
app.include_router(reports_router)
app.include_router(upload_outline_file_router)
app.include_router(update_graph_router)

if __name__ == "__main__":
    uvicorn.run("api.app:app", host="0.0.0.0", port=8000, reload=True, loop="asyncio")
