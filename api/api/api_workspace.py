from fastapi import APIRouter, HTTPException, Form, Depends, Request
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
from db_models.workspace import CurrentWorkspace
from api.api_user import get_current_user, User as UserModelSerializer
from db_models.workspace import CurrentWorkspace
from db_models.deals import Deal

current_workspace_router = APIRouter()

# Base schema for all tables
class BaseTableSchema(BaseModel):
    type: str
    text: str

# CurrentWorkspace schema
class CurrentWorkspaceCreate(BaseTableSchema):
    deal_id: UUID

class CurrentWorkspaceResponse(BaseModel):
    id: UUID
    deal_id: UUID
    type: str
    text: Optional[str] = None
    class Config:
        from_attributes = True

@current_workspace_router.post("/current_workspace/", response_model=CurrentWorkspaceResponse)
def add_current_workspace(item: CurrentWorkspaceCreate, db: Session = Depends(get_db),current_user: UserModelSerializer = Depends(get_current_user)):
    data=db.query(Deal).filter(Deal.id==item.deal_id).first()
    if str(data.user_id) != current_user.id:
        raise HTTPException(status_code=404, detail="You are not authorized to add workspace")
    workspace = CurrentWorkspace(**item.dict())
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    return workspace

@current_workspace_router.put("/current_workspace/{workspace_id}", response_model=CurrentWorkspaceResponse)
def update_workspace(workspace_id: str, item: BaseTableSchema, db: Session = Depends(get_db), current_user: UserModelSerializer = Depends(get_current_user)):
    workspace = db.query(CurrentWorkspace).filter(CurrentWorkspace.id == workspace_id).first()
    data=db.query(Deal).filter(Deal.id==workspace.deal_id).first()
    if str(data.user_id) != current_user.id:
        raise HTTPException(status_code=404, detail="You are not authorized to modify workspace")
    if not workspace:
        raise HTTPException(status_code=404, detail="data item not found")
    workspace.type = item.type
    workspace.text = item.text
    db.commit()
    db.refresh(workspace)
    return workspace


@current_workspace_router.delete("/current_workspace/{workspace_id}", response_model=CurrentWorkspaceResponse)
def delete_todo(workspace_id: str, db: Session = Depends(get_db), current_user: UserModelSerializer = Depends(get_current_user)):
    workspace = db.query(CurrentWorkspace).filter(CurrentWorkspace.id == workspace_id).first()
    data=db.query(Deal).filter(Deal.id==workspace.deal_id).first()
    if str(data.user_id) != current_user.id:
        raise HTTPException(status_code=404, detail="You are not authorized to delete workspace")
    if not workspace:
        raise HTTPException(status_code=404, detail="Current workspace not found")
    db.delete(workspace)
    db.commit()
    return workspace

@current_workspace_router.get("/current_workspace/", response_model=List[CurrentWorkspaceResponse])
def current_worspace(deal_id: Optional[UUID] = None, db: Session = Depends(get_db), current_user: UserModelSerializer = Depends(get_current_user)):
    data=db.query(Deal).filter(Deal.id==deal_id).first()
    if str(data.user_id) != current_user.id:
        raise HTTPException(status_code=404, detail="You are not authorized to fetch workspace")
    query = db.query(CurrentWorkspace)
    if deal_id:
        query = query.filter(CurrentWorkspace.deal_id == deal_id)
    current_workspace = query.all()
    if not current_workspace:
        if deal_id:
            error_message = f"No data items found for deal_id: {deal_id}"
        else:
            error_message = "No data items found."
        raise HTTPException(status_code=404, detail=error_message)
    return current_workspace
