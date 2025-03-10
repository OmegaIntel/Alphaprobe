# Standard Library Imports
import uvicorn

# Third-Party Imports
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Local Application/Library Specific Imports
from routes.routes import router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
