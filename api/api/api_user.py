from fastapi import APIRouter, HTTPException, Form, Depends, Request
from pydantic import BaseModel, EmailStr
from typing import Optional
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
import os
import logging
from sqlalchemy.orm import Session
from db_models.users import User as DbUser
from typing import Annotated
from db_models.session import get_db
from db_models.new_users import NewUsersDeals
from db_models.shared_user_deals import SharedUserDeals

# Environment variables and constants
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

# FastAPI OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Initialize the router
user_router = APIRouter()

# Configure password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pydantic models for user and token
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class User(BaseModel):
    id: str
    email: str
    is_admin: bool

    class Config:
        from_attributes = True

# Utility functions for password management and JWT handling
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(DbUser).filter(DbUser.email == email).first()
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = db.query(DbUser).filter(DbUser.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    
    return User(id=str(user.id), email=user.email,is_admin = user.is_master_admin)

async def bypass_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        token_data = TokenData(email=email)
    except jwt.PyJWTError:
        return None
    
    user = db.query(DbUser).filter(DbUser.email == token_data.email).first()
    if user is None:
        return None
    
    return User(id=str(user.id), email=user.email,is_admin = user.is_master_admin)

# API route for user registration
@user_router.post("/api/register", response_model=User)
async def register(email: EmailStr = Form(...), password: str = Form(...), request: Request = None, db: Session = Depends(get_db)):
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
            user_id=str(new_user.id),
            deal_id=str(newUser.deal_id)
        )
        db.add(sharedUser)
        db.commit()
        db.refresh(sharedUser)
    
    # Convert UUID to string and return
    return {"id": str(new_user.id), "email": new_user.email,'is_admin':new_user.is_master_admin}


# API route for token-based login
@user_router.post("/api/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# API route to get the current logged-in user
@user_router.get("/api/users/me")
async def read_users_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user
