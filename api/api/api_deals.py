from fastapi import APIRouter, HTTPException, Form, Depends, Request
from pydantic import BaseModel, EmailStr
from db_models.session import get_db
from sqlalchemy.orm import Session
from db_models.demo_requests import DemoRequests
import uuid
from typing import Optional
from sqlalchemy.exc import SQLAlchemyError

deals_router = APIRouter()

