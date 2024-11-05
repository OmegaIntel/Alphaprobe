from pydantic import BaseModel

class CompanyRequest(BaseModel):
    company_name: str