from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy import func
from db_models.session import get_db
from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional, List
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
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
from db_models.task_status import ToDo
from api.api_user import get_current_user, User as UserModelSerializer
from db_models.deals import Deal
from db_models.shared_user_deals import SharedUserDeals

task_status_router = APIRouter()


class ToDoBase(BaseModel):
    task: str
    status: str
    due_date: Optional[datetime] = None
    priority: Optional[str] = Field(None, description="Priority of the task (High, Medium, Low)")
    custom_tags: Optional[str] = None
    description: Optional[str] = None

class ToDoCreate(ToDoBase):
    deal_id: str

class ToDoResponse(BaseModel):
    id: UUID
    deal_id: UUID
    task: str
    status: str
    due_date: Optional[datetime] = None
    priority: Optional[str]
    custom_tags: Optional[str]
    description: Optional[str]

    class Config:
        from_attributes = True



@task_status_router.post("/api/todos/", response_model=ToDoResponse)
def add_todo(item: ToDoCreate, db: Session = Depends(get_db), current_user: UserModelSerializer = Depends(get_current_user)):
    data = db.query(Deal).filter(Deal.id == item.deal_id).first()
    if str(data.user_id) != current_user.id:
        shared_deal = db.query(SharedUserDeals).filter(SharedUserDeals.user_id == current_user.id).first()
        if shared_deal:
            pass
        else:
            raise HTTPException(status_code=404, detail="You are not authorized to add To-Do items")
    todo = ToDo(**item.dict())
    db.add(todo)
    data.updated_at = func.current_timestamp()
    db.add(data)
    db.commit()
    db.refresh(todo)
    db.refresh(data)
    return todo


@task_status_router.get("/api/todos/", response_model=List[ToDoResponse])
def get_todos(deal_id: Optional[UUID] = None, db: Session = Depends(get_db), current_user: UserModelSerializer = Depends(get_current_user)):
    data = db.query(Deal).filter(Deal.id == deal_id).first()
    if str(data.user_id) != current_user.id:
        shared_deal = db.query(SharedUserDeals).filter(SharedUserDeals.user_id == current_user.id).first()
        if shared_deal:
            pass
        else:
            raise HTTPException(status_code=404, detail="You are not authorized to fetch To-Do items")
    query = db.query(ToDo)
    if deal_id:
        query = query.filter(ToDo.deal_id == deal_id)
    todos = query.all()
    if not todos:
        if deal_id:
            error_message = f"No To-Do items found for deal_id: {deal_id}"
        else:
            error_message = "No To-Do items found."
        raise HTTPException(status_code=404, detail=error_message)
    return todos

@task_status_router.put("/api/todos/{todo_id}", response_model=ToDoResponse)
def update_todo(todo_id: str, item: ToDoBase, db: Session = Depends(get_db),current_user: UserModelSerializer = Depends(get_current_user)):
    todo = db.query(ToDo).filter(ToDo.id == todo_id).first()
    data=db.query(Deal).filter(Deal.id==todo.deal_id).first()
    if str(data.user_id) != current_user.id:
        shared_deal = db.query(SharedUserDeals).filter(SharedUserDeals.user_id == current_user.id).first()
        if shared_deal:
            pass
        else:
            raise HTTPException(status_code=404, detail="You are not authorized to modify To-Do items")
    if not todo:
        raise HTTPException(status_code=404, detail="To-Do item not found")
    todo.task = item.task
    todo.status = item.status
    todo.due_date = item.due_date
    todo.priority = item.priority
    todo.custom_tags = item.custom_tags
    todo.description = item.description
    data.updated_at = func.current_timestamp()
    db.add(data)
    db.commit()
    db.refresh(data)
    db.refresh(todo)
    return todo

@task_status_router.delete("/api/todos/{todo_id}", response_model=ToDoResponse)
def delete_todo(todo_id: str, db: Session = Depends(get_db),current_user: UserModelSerializer = Depends(get_current_user)):
    todo = db.query(ToDo).filter(ToDo.id == todo_id).first()
    data=db.query(Deal).filter(Deal.id==todo.deal_id).first()
    if str(data.user_id) != current_user.id:
        shared_deal = db.query(SharedUserDeals).filter(SharedUserDeals.user_id == current_user.id).first()
        if shared_deal:
            pass
        else:
            raise HTTPException(status_code=404, detail="You are not authorized to delete To-Do items")
    if not todo:
        raise HTTPException(status_code=404, detail="To-Do item not found")
    db.delete(todo)
    data.updated_at = func.current_timestamp()
    db.add(data)
    db.commit()
    db.refresh(data)
    return todo