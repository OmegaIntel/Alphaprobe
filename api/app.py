import logging_config
import uvicorn
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from apis.api_user import user_router
from pydantic import ValidationError
from apis.api_generate_pdf import pdf_report_router
from apis.api_projects import project_router
from websocket_manager import WebSocketManager
from utils.websocket_utils import handle_websocket_communication
from apis.api_deep_researcher import research_deep_router
from apis.api_kb_search import aws_kb_router


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


app.include_router(user_router)
app.include_router(pdf_report_router)
app.include_router(project_router)
app.include_router(research_deep_router)
app.include_router(aws_kb_router)

if __name__ == "__main__":
    uvicorn.run("api.app:app", host="0.0.0.0", port=8000, reload=True, loop="asyncio")
