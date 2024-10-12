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