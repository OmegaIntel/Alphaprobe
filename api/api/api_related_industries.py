"""Returns lists of related industries in response to UI requests."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict

import random


class UserQR(BaseModel):
    question: str
    response: str

class DataModelIn(BaseModel):
    data: List[UserQR]


class IndustryCode(BaseModel):
    industry_name: str
    industry_code: str

class DataModelOut(BaseModel):
    result: List[IndustryCode]


related_industries_router = APIRouter()



_FAKE_LIST = [
  {
    "industry_name": "Soybean Farming",
    "industry_code": "111110"
  },
  {
    "industry_name": "Chicken Egg Production",
    "industry_code": "112310"
  },
  {
    "industry_name": "Logging",
    "industry_code": "113310"
  },
  {
    "industry_name": "Commercial Fishing",
    "industry_code": "114111"
  },
  {
    "industry_name": "Support Activities for Crop Production",
    "industry_code": "115110"
  },
  {
    "industry_name": "Oil and Gas Extraction",
    "industry_code": "211120"
  },
  {
    "industry_name": "Gold Ore Mining",
    "industry_code": "212221"
  },
  {
    "industry_name": "Electric Power Distribution",
    "industry_code": "221122"
  },
  {
    "industry_name": "New Single-Family Housing Construction",
    "industry_code": "236115"
  },
  {
    "industry_name": "Highway, Street, and Bridge Construction",
    "industry_code": "237310"
  },
  {
    "industry_name": "Plumbing, Heating, and Air-Conditioning Contractors",
    "industry_code": "238220"
  },
  {
    "industry_name": "Commercial Bakeries",
    "industry_code": "311812"
  },
  {
    "industry_name": "Wineries",
    "industry_code": "312130"
  },
  {
    "industry_name": "Men's and Boys' Cut and Sew Apparel Manufacturing",
    "industry_code": "315210"
  },
  {
    "industry_name": "Sawmills",
    "industry_code": "321113"
  },
  {
    "industry_name": "Commercial Printing (except Screen and Books)",
    "industry_code": "323111"
  },
  {
    "industry_name": "Petroleum Refineries",
    "industry_code": "324110"
  },
  {
    "industry_name": "Pharmaceutical Preparation Manufacturing",
    "industry_code": "325412"
  },
  {
    "industry_name": "Iron and Steel Mills",
    "industry_code": "331110"
  },
  {
    "industry_name": "Semiconductor and Related Device Manufacturing",
    "industry_code": "334413"
  },
  {
    "industry_name": "Automobile Manufacturing",
    "industry_code": "336111"
  },
  {
    "industry_name": "Aircraft Manufacturing",
    "industry_code": "336411"
  },
  {
    "industry_name": "Surgical and Medical Instrument Manufacturing",
    "industry_code": "339112"
  },
  {
    "industry_name": "Supermarkets and Other Grocery Stores",
    "industry_code": "445110"
  },
  {
    "industry_name": "Internet Publishing and Broadcasting and Web Search Portals",
    "industry_code": "519130"
  }
]


# @related_industries_router.post("/api/industries-for-thesis", response_model=List[IndustryCode])
# async def industries_for_thesis(request: List[UserQA]) -> List[IndustryCode]:
@related_industries_router.post("/api/industries-for-thesis", response_model=DataModelOut)
async def industries_for_thesis(request: DataModelIn) -> List[Dict[str, str]]:
    """Takes users Questions and Answers and returns a list of industries and their codes."""
    user_qa = request.data
    for elt in user_qa:
        assert elt.question, elt.response
    sample = random.sample(_FAKE_LIST, 10)
    return DataModelOut(result=sample)
    # return sample

"""
from fastapi import APIRouter, HTTPException, Form, Depends, Request
from pydantic import BaseModel, EmailStr
from db_models.session import get_db
from sqlalchemy.orm import Session
from db_models.demo_requests import DemoRequests
import uuid
from typing import Optional
from sqlalchemy.exc import SQLAlchemyError

demo_request_router = APIRouter()


# Pydantic model
class DemoRequestCreate(BaseModel):
    name: str
    company: Optional[str] = None
    email: EmailStr
    message: Optional[str] = None

@demo_request_router.post("/api/request-demo", response_model=None)
async def request_demo(request: DemoRequestCreate, db: Session = Depends(get_db)):
    try:
        demo_request = DemoRequests(
            id=uuid.uuid4(),
            name=request.name,
            company=request.company,
            email=request.email,
            message=request.message
        )
        db.add(demo_request)
        db.commit()
        return {"message": "Demo request received successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Database error: " + str(e))
"""
