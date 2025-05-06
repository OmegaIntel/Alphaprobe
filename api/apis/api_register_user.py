from fastapi import APIRouter, HTTPException, Form, Depends, Request
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
import logging
from sqlalchemy.orm import Session
from db_models.users import User as DbUser
from typing import Annotated
from db.db_session import get_db
from db_models.new_users import NewUsersDeals
from db_models.shared_user_deals import SharedUserDeals


# Initialize the router
user_register_router = APIRouter()


# Configure password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class User(BaseModel):
    id: str
    email: str
    is_admin: bool

    class Config:
        from_attributes = True


def get_password_hash(password):
    return pwd_context.hash(password)


# API route for user registration
@user_register_router.post("/api/register", response_model=User)
async def register(
    email: EmailStr = Form(...),
    password: str = Form(...),
    request: Request = None,
    db: Session = Depends(get_db),
):
    if request:
        logging.info(f"Register request: {await request.form()}")

        user = db.query(DbUser).filter(DbUser.email == email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")

    newUser = db.query(NewUsersDeals).filter(NewUsersDeals.email_id == email).first()

    hashed_password = get_password_hash(password)
    new_user = DbUser(email=email, password_hash=hashed_password)
    db.add(new_user)
    db.commit()

    # Refresh to get the id from the database
    db.refresh(new_user)

    if newUser:
        sharedUser = SharedUserDeals(
            user_id=str(new_user.id), deal_id=str(newUser.deal_id)
        )
        db.add(sharedUser)
        db.commit()
        db.refresh(sharedUser)

    # Convert UUID to string and return
    return {
        "id": str(new_user.id),
        "email": new_user.email,
        "is_admin": new_user.is_master_admin,
    }
