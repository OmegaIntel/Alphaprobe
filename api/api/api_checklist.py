from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from db_models.session import get_db
from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional, List
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from db_models.checklist import Checklist
from api.api_user import get_current_user, User as UserModelSerializer


checklist_base_router = APIRouter()

# Base schema for all tables
class BaseTableSchema(BaseModel):
    type: str
    text: str

# checklist schema
class checklist(BaseTableSchema):
    deal_id: UUID

class Checklistresponse(BaseModel):
    id: UUID
    deal_id: UUID
    type: str
    text: Optional[str] = None
    class Config:
        from_attributes = True

@checklist_base_router.post("/checklist/", response_model=Checklistresponse)
def add_checklist(item: checklist, db: Session = Depends(get_db),current_user: UserModelSerializer = Depends(get_current_user)):
    data =Checklist (**item.dict())
    db.add(data)
    db.commit()
    db.refresh(data)
    return data

@checklist_base_router.put("/checklist/{checklist_id}", response_model=Checklistresponse)
def update_checklist(checklist_id: str, item: BaseTableSchema, db: Session = Depends(get_db),current_user: UserModelSerializer = Depends(get_current_user)):
    data = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not data:
        raise HTTPException(status_code=404, detail="data item not found")
    data.type = item.type
    data.text = item.text
    db.commit()
    db.refresh(data)
    return data


@checklist_base_router.delete("/checklist/{checklist_id}", response_model=Checklistresponse)
def delete_data(checklist_id: str, db: Session = Depends(get_db),current_user: UserModelSerializer = Depends(get_current_user)):
    data = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not data:
        raise HTTPException(status_code=404, detail="Current data not found")
    db.delete(data)
    db.commit()
    return data

@checklist_base_router.get("/checklist/", response_model=List[Checklistresponse])
def checklistcontext(deal_id: Optional[UUID] = None, db: Session = Depends(get_db),current_user: UserModelSerializer = Depends(get_current_user)):
    query = db.query(Checklist)
    if deal_id:
        query = query.filter(Checklist.deal_id == deal_id)
    data = query.all()
    if not data:
        if deal_id:
            error_message = f"No data items found for deal_id: {deal_id}"
        else:
            error_message = "No data items found."
        raise HTTPException(status_code=404, detail=error_message)
    return data
