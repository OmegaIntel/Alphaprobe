from fastapi import APIRouter, HTTPException, Form, Depends, Request, status
from pydantic import BaseModel, EmailStr
from typing import Optional, List
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
from api_user import get_current_user

# Initialize the router
dashboard_router = APIRouter()

# Pydantic models
class User(BaseModel):
    id: Optional[str]
    email: str
    name: Optional[str]
    role: Optional[str]

class Article(BaseModel):
    title: str
    description: str
    url: str
    source: str
    published_at: str

class NewsResponse(BaseModel):
    articles: List[Article]

class ErrorResponse(BaseModel):
    error: str

class SendMailRequest(BaseModel):
    to: EmailStr

class SendMailResponse(BaseModel):
    message: str

class Attendee(BaseModel):
    email: EmailStr

class ScheduleMeetingRequest(BaseModel):
    title: str
    start_time: str  # ISO 8601 format
    end_time: str    # ISO 8601 format
    attendees: List[Attendee]
    description: Optional[str]
    location: Optional[str]

class ScheduleMeetingResponse(BaseModel):
    message: str
    event_id: str
    calendly_url: str

class CollaborationInviteRequest(BaseModel):
    email: EmailStr

class CollaborationInviteResponse(BaseModel):
    message: str

class ActivityDeal(BaseModel):
    deal_id: str
    deal_progress: str

class Activity(BaseModel):
    activity_id: str
    description: str
    timestamp: str  # ISO 8601 format
    deal: ActivityDeal
    action_items: List[str]

class RecentActivityResponse(BaseModel):
    activities: List[Activity]

class PipelineDeal(BaseModel):
    deal_id: str
    deal_progress: str

class DealPipelineResponse(BaseModel):
    pipeline: List[PipelineDeal]

# 1. News Endpoint (3rd Party)
@dashboard_router.get("/dashboard/news", response_model=NewsResponse, responses={400: {"model": ErrorResponse}})
async def get_news(category: Optional[str] = None, limit: Optional[int] = None):
    try:
        # Placeholder for integrating with a real news API
        articles = [
            {
                "title": "Sample News",
                "description": "This is a sample news article.",
                "url": "https://news.example.com/article",
                "source": "Example News Source",
                "published_at": datetime.utcnow().isoformat()
            }
        ]
        return {"articles": articles}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# 2. Send Mail
@dashboard_router.post("/dashboard/send-mail", response_model=SendMailResponse, responses={400: {"model": ErrorResponse}})
async def send_mail(request: SendMailRequest):
    try:
        # Placeholder for sending email using an email service
        return {"message": "Email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# 3. Meeting Schedule (using Calendly API)
@dashboard_router.post("/dashboard/schedule-meeting", response_model=ScheduleMeetingResponse, responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}})
async def schedule_meeting(request: ScheduleMeetingRequest):
    try:
        # Placeholder for integrating with Calendly API
        return {
            "message": "Meeting scheduled successfully",
            "event_id": "event123",
            "calendly_url": "https://calendly.com/your-event/event123"
        }
    except HTTPException as e:
        if e.status_code == 401:
            raise HTTPException(status_code=401, detail="Calendly API authorization failed")
        else:
            raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# 4. User and Roles
@dashboard_router.get("/dashboard/users", response_model=List[User], responses={400: {"model": ErrorResponse}})
async def get_users(db: Session = Depends(get_db), current_user: Annotated[User, Depends(get_current_user)] = None):
    try:
        users_db = db.query(DbUser).all()
        users = [User(id=str(user.id), name=user.name, email=user.email, role=user.role) for user in users_db]
        return users
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@dashboard_router.put("/dashboard/users/{id}/role", responses={200: {"model": SendMailResponse}, 404: {"model": ErrorResponse}})
async def update_user_role(id: str, role: str = Form(...), db: Session = Depends(get_db), current_user: Annotated[User, Depends(get_current_user)] = None):
    try:
        user = db.query(DbUser).filter(DbUser.id == id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.role = role
        db.commit()
        return {"message": "User role updated successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# 5. Collaboration Invite System
@dashboard_router.post("/dashboard/invite", response_model=CollaborationInviteResponse, responses={400: {"model": ErrorResponse}})
async def send_invite(request: CollaborationInviteRequest):
    try:
        # Placeholder for sending an invitation email
        return {"message": "Collaboration invite sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# 6. Recent Activity
@dashboard_router.get("/dashboard/recent-activity", response_model=RecentActivityResponse, responses={400: {"model": ErrorResponse}})
async def get_recent_activity(current_user: Annotated[User, Depends(get_current_user)] = None):
    try:
        activities = [
            {
                "activity_id": "activity1",
                "description": "Completed a task",
                "timestamp": datetime.utcnow().isoformat(),
                "deal": {
                    "deal_id": "deal123",
                    "deal_progress": "In Progress"
                },
                "action_items": [
                    "Prepare proposal",
                    "Schedule follow-up meeting"
                ]
            }
        ]
        return {"activities": activities}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# 7. Deal Pipeline
@dashboard_router.get("/dashboard/deal-pipeline", response_model=DealPipelineResponse, responses={400: {"model": ErrorResponse}})
async def get_deal_pipeline(current_user: Annotated[User, Depends(get_current_user)] = None):
    try:
        pipeline = [
            {
                "deal_id": "deal123",
                "deal_progress": "In Progress"
            }
        ]
        return {"pipeline": pipeline}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# View and test with FastAPI
# from fastapi import FastAPI
# app = FastAPI()
# app.include_router(dashboard_router)
