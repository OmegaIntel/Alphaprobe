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
from db_models.knowledgebase import knowledgebase
from api.api_user import get_current_user, User as UserModelSerializer
from db_models.deals import Deal
from db_models.shared_user_deals import SharedUserDeals

knowledge_base_router = APIRouter()

# Base schema for all tables
class BaseTableSchema(BaseModel):
    type: str
    text: str

# knowledge schema
class Knowledgebasecreate(BaseTableSchema):
    deal_id: UUID

class Knowledgebaseresponse(BaseModel):
    id: UUID
    deal_id: UUID
    type: str
    text: Optional[str] = None
    class Config:
        from_attributes = True

@knowledge_base_router.post("/api/knowledgebase/", response_model=Knowledgebaseresponse)
def add_knowledgebase(item: Knowledgebasecreate, db: Session = Depends(get_db),current_user: UserModelSerializer = Depends(get_current_user)):
    data=db.query(Deal).filter(Deal.id==item.deal_id).first()
    if str(data.user_id) != current_user.id:
        shared_deal = db.query(SharedUserDeals).filter(SharedUserDeals.user_id == current_user.id).first()
        if shared_deal:
            pass
        else:
            raise HTTPException(status_code=404, detail="You are not authorized to add knowledgebase")
    data =knowledgebase (**item.dict())
    db.add(data)
    db.commit()
    db.refresh(data)
    return data

@knowledge_base_router.put("/api/knowledgebase/{knowledgebase_id}", response_model=Knowledgebaseresponse)
def update_knowledge(knowledgebase_id: str, item: BaseTableSchema, db: Session = Depends(get_db),current_user: UserModelSerializer = Depends(get_current_user)):
    base = db.query(knowledgebase).filter(knowledgebase.id == knowledgebase_id).first()
    data=db.query(Deal).filter(Deal.id==base.deal_id).first()
    if str(data.user_id) != current_user.id:
        shared_deal = db.query(SharedUserDeals).filter(SharedUserDeals.user_id == current_user.id).first()
        if shared_deal:
            pass
        else:
            raise HTTPException(status_code=404, detail="You are not authorized to modify KNowledgebase")
    if not base:
        raise HTTPException(status_code=404, detail="data item not found")
    base.type = item.type
    base.text = item.text
    db.commit()
    db.refresh(base)
    return base


@knowledge_base_router.delete("/api/knowledgebase/{knowledgebase_id}", response_model=Knowledgebaseresponse)
def delete_data(knowledgebase_id: str, db: Session = Depends(get_db),current_user: UserModelSerializer = Depends(get_current_user)):
    base = db.query(knowledgebase).filter(knowledgebase.id == knowledgebase_id).first()
    data=db.query(Deal).filter(Deal.id==base.deal_id).first()
    if str(data.user_id) != current_user.id:
        shared_deal = db.query(SharedUserDeals).filter(SharedUserDeals.user_id == current_user.id).first()
        if shared_deal:
            pass
        else:
            raise HTTPException(status_code=404, detail="You are not authorized to delete KNowledgebase")
    if not base:
        raise HTTPException(status_code=404, detail="Current data not found")
    db.delete(base)
    db.commit()
    return base

@knowledge_base_router.get("/api/knowledgebase/", response_model=List[Knowledgebaseresponse])
def knowledgecontext(deal_id: Optional[UUID] = None,type: Optional[str] = None, db: Session = Depends(get_db),current_user: UserModelSerializer = Depends(get_current_user)):
    data = db.query(Deal).filter(Deal.id == deal_id).first()
    if not data or str(data.user_id) != current_user.id:
        shared_deal = db.query(SharedUserDeals).filter(SharedUserDeals.user_id == current_user.id).first()
        if shared_deal:
            pass
        else:
            raise HTTPException(status_code=404, detail="You are not authorized to fetch Knowledgebase")
    query = db.query(knowledgebase)
    if deal_id:
        query = query.filter(knowledgebase.deal_id == deal_id)
    if type:
        query = query.filter(knowledgebase.type == type)
    data = query.all()
    if not data:
        if deal_id and type:
            error_message = f"No data items found for deal_id: {deal_id} and type: {type}"
        elif deal_id:
            error_message = f"No data items found for deal_id: {deal_id}"
        else:
            error_message = "No data items found."
        raise HTTPException(status_code=404, detail=error_message)
    return data
