from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from fastapi.security import OAuth2PasswordBearer
import jwt
import os
from sqlalchemy.orm import Session
from db_models.users import User as DbUser
from typing import Annotated
from db.db_session import get_db

# Initialize the router
current_user_router = APIRouter()

# Environment variables and constants
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"

# FastAPI OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


class User(BaseModel):
    id: str
    email: str
    is_admin: bool

    class Config:
        from_attributes = True


class TokenData(BaseModel):
    email: Optional[str] = None


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)
) -> User:
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

    return User(id=str(user.id), email=user.email, is_admin=user.is_master_admin)


# API route to get the current logged-in user
@current_user_router.get("/api/users/me")
async def read_users_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user
