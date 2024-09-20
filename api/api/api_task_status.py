from fastapi import APIRouter, HTTPException, Form, Depends, Request
from pydantic import BaseModel, EmailStr
from db_models.session import get_db
from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional, List
from uuid import UUID
from db_models.demo_requests import DemoRequests
import uuid
from typing import Optional
from sqlalchemy.exc import SQLAlchemyError
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from db_models.users import User 
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


task_status_router = APIRouter()

class ToDoBase(BaseModel):
    task: str
    status: str

class ToDoCreate(ToDoBase):
    deal_id: str

class ToDoResponse(BaseModel):
    id: UUID
    deal_id: UUID
    task: str
    status: str

    class Config:
        from_attributes = True


@task_status_router.post("/todos/", response_model=ToDoResponse)
def add_todo(item: ToDoCreate, db: Session = Depends(get_db),current_user: UserModelSerializer = Depends(get_current_user)):
    todo = ToDo(**item.dict())
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@task_status_router.get("/todos/", response_model=List[ToDoResponse])
def get_todos(deal_id: Optional[UUID] = None, db: Session = Depends(get_db),current_user: UserModelSerializer = Depends(get_current_user)):
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


@task_status_router.put("/todos/{todo_id}", response_model=ToDoResponse)
def update_todo(todo_id: str, item: ToDoBase, db: Session = Depends(get_db),current_user: UserModelSerializer = Depends(get_current_user)):
    todo = db.query(ToDo).filter(ToDo.id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="To-Do item not found")
    todo.task = item.task
    todo.status = item.status
    db.commit()
    db.refresh(todo)
    return todo

@task_status_router.delete("/todos/{todo_id}", response_model=ToDoResponse)
def delete_todo(todo_id: str, db: Session = Depends(get_db),current_user: UserModelSerializer = Depends(get_current_user)):
    todo = db.query(ToDo).filter(ToDo.id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="To-Do item not found")
    db.delete(todo)
    db.commit()
    return todo

