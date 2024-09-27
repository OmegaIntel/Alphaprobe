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
from db_models.deals import Deal, DealStatus
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from api.api_user import get_current_user, User as UserModelSerializer

deals_router = APIRouter()

class DealBase(BaseModel):
    name: str = Field(..., max_length=255)
    overview: Optional[str] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    industry: Optional[str] = Field(None, max_length=255)
    progress: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = None

class DealResponse(DealBase):
    id: UUID

class DealCreation(DealBase):
    investment_thesis: Optional[str] = None


@deals_router.post("/deals/", response_model=DealResponse)
def create_deal(
    deal_data: DealCreation,
    db: Session = Depends(get_db),
    current_user: UserModelSerializer = Depends(get_current_user)
):
    try:
        # Create a new Deal object
        new_deal = Deal(
            user_id=current_user.id,
            name=deal_data.name,
            overview=deal_data.overview,
            start_date=deal_data.start_date or func.current_timestamp(),
            due_date=deal_data.due_date,
            industry=deal_data.industry,
            progress=deal_data.progress
        )
        db.add(new_deal)
        db.commit()
        db.refresh(new_deal)

        # Create and add the workspace entry
        new_ws = CurrentWorkspace(deal_id=new_deal.id, text=deal_data.investment_thesis, type="Investment Thesis")
        db.add(new_ws)
        db.commit()
        db.refresh(new_ws)

        # Return the new deal in the expected format
        return DealResponse(
            id=new_deal.id,
            name=new_deal.name,
            overview=new_deal.overview,
            start_date=new_deal.start_date,
            due_date=new_deal.due_date,
            industry=new_deal.industry,
            progress=new_deal.progress
        )
    except SQLAlchemyError as e:
        db.rollback()  # Rollback the session on error
        raise HTTPException(status_code=500, detail=str(e))
    

@deals_router.put("/deals/{deal_id}", response_model=DealResponse)
def update_deal(
    deal_id: str,
    deal_data: DealBase,
    db: Session = Depends(get_db),
    current_user: UserModelSerializer = Depends(get_current_user)
):
    try:
        # Fetch the deal by ID and ensure it belongs to the current user
        deal = db.query(Deal).filter(Deal.id == deal_id, Deal.user_id == current_user.id).first()
        
        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found or you do not have access to it")

        # Update the deal fields that are provided
        if deal_data.name:
            deal.name = deal_data.name
        if deal_data.overview:
            deal.overview = deal_data.overview
        if deal_data.start_date:
            deal.start_date = deal_data.start_date
        if deal_data.due_date:
            deal.due_date = deal_data.due_date
        if deal_data.industry:
            deal.industry = deal_data.industry
        
        if deal_data.progress is not None:  # Ensure progress is not skipped
            progress = int(deal_data.progress)  # Convert progress from string to integer
            deal.progress = deal_data.progress
            
            # Update the status based on the progress value
            if progress == 0:
                deal.status = DealStatus.NOT_STARTED
            elif progress == 100:
                deal.status = DealStatus.COMPLETED
            else:
                deal.status = DealStatus.IN_PROGRESS
        
        # Commit the changes to the database
        db.commit()
        db.refresh(deal)

        # Return the updated deal
        return DealResponse(
            id=deal.id,
            name=deal.name,
            overview=deal.overview,
            start_date=deal.start_date,
            due_date=deal.due_date,
            industry=deal.industry,
            progress=deal.progress,
            status=deal.status.value  # Return the string value of the Enum
        )
    except SQLAlchemyError as e:
        db.rollback()  # Rollback the session in case of an error
        raise HTTPException(status_code=500, detail=str(e))


@deals_router.get("/fetch_deals", response_model=List[DealResponse])
def get_deals(
    db: Session = Depends(get_db),
    current_user: UserModelSerializer = Depends(get_current_user)
):
    deals = db.query(Deal).filter(Deal.user_id == current_user.id).all()
    if not deals:
        raise HTTPException(status_code=404, detail="No deals found for this user")
    return deals
