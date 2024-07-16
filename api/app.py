import uvicorn
from fastapi import FastAPI
from api import router as chat_router

app = FastAPI()


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
