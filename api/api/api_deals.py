from fastapi import APIRouter, HTTPException, Form, Depends, Request
from pydantic import BaseModel, EmailStr
from db_models.session import get_db
from sqlalchemy.orm import Session
from db_models.demo_requests import DemoRequests
import uuid
from typing import Optional
from sqlalchemy.exc import SQLAlchemyError
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from db_models.users import User
from db_models.workspace import CurrentWorkspace
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional
from db_models.deals import Deal
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from api.api_user import get_current_user, User as UserModelSerializer

deals_router = APIRouter()

class DealCreation(BaseModel):
    name: str = Field(..., max_length=255)
    overview: Optional[str] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    industry: Optional[str] = Field(None, max_length=255)
    progress: Optional[str] = Field(None, max_length=255)
    investment_thesis: Optional[str] = None


@deals_router.post("/deals/", response_model=DealCreation)
def create_deal(deal_data: DealCreation, db: Session = Depends(get_db), current_user: UserModelSerializer = Depends(get_current_user)):
    # Create a new Deal object
    new_deal = Deal(
        user_id=current_user.id,
        name=deal_data.name,
        overview=deal_data.overview,
        start_date=deal_data.start_date if deal_data.start_date else func.current_timestamp(),
        due_date=deal_data.due_date,
        industry=deal_data.industry,
        progress=deal_data.progress
    )
    db.add(new_deal)
    db.commit()
    db.refresh(new_deal)

    new_ws = CurrentWorkspace(deal_id = new_deal.id, text=deal_data.investment_thesis, type="investment_thesis")
    db.add(new_ws)
    db.commit()
    db.refresh(new_ws)    
    return new_deal

@deals_router.get("/fetch_deals", response_model=List[DealCreation])
def get_deals(db: Session = Depends(get_db), current_user: UserModelSerializer = Depends(get_current_user)):
    deals = db.query(Deal).filter(Deal.user_id == current_user.id).all()
    if not deals:
        raise HTTPException(status_code=404, detail="No deals found for this user")
    return deals