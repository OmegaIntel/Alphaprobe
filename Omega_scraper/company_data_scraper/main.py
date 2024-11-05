from fastapi import FastAPI
from pydantic import BaseModel
from services import linkedin_service, crunchbase_service, owler_service, pitchbook_service

app = FastAPI()

class CompanyRequest(BaseModel):
    company_name: str

app.include_router(linkedin_service.router)
app.include_router(crunchbase_service.router)
app.include_router(owler_service.router)
app.include_router(pitchbook_service.router)