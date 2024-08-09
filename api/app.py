import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from api.api.api_chat import chat_router
from api.api.api_user import user_router
from pydantic import ValidationError


app = FastAPI()

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
    print(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )



app.include_router(chat_router)
app.include_router(user_router)

if __name__ == "__main__":
    uvicorn.run("api.app:app", host="0.0.0.0", port=8000, reload=True)
