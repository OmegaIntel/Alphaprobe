from fastapi import  APIRouter,HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
import requests
import os
from sqlalchemy.orm import Session
from db_models.session import get_db
from dotenv import load_dotenv
from db_models.users import User as UserModal
from api.api.api_user import get_current_user,User


load_dotenv()

calendly_router = APIRouter()

# Calendly OAuth credentials (from Calendly App settings)
CLIENT_ID = os.getenv("CALENDLY_CLIENT_ID")
CLIENT_SECRET = os.getenv("CALENDLY_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")  # Your redirect URI

# Calendly OAuth2 URLs
CALENDLY_AUTH_URL = "https://auth.calendly.com/oauth/authorize"
CALENDLY_TOKEN_URL = "https://auth.calendly.com/oauth/token"
CALENDLY_API_BASE = "https://api.calendly.com"

# Step 1: Redirect to Calendly OAuth2 for user authorization
@calendly_router.get("/api/connect-calendly")
def connect_calendly(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    authorization_url = (
        f"{CALENDLY_AUTH_URL}?client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}&response_type=code&scope=default&user_id={current_user.id}"
    )
    return {'url':authorization_url}

@calendly_router.get("/api/calendly/callback")
def calendly_callback(code: str,current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Exchange code for access token
    token_response = requests.post(
        CALENDLY_TOKEN_URL,
        data={
            "grant_type": "authorization_code",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI,
            "code": code,
        }
    )

    if token_response.status_code == 200:
        access_token = token_response.json().get("access_token")
        refresh_token = token_response.json().get("refresh_token")

        # Update user with the new access token
        user = db.query(UserModal).filter(UserModal.id == current_user.id).first()
        if user:
            user.calendly_access_token = access_token
            user.calendly_refresh_token = refresh_token
            db.commit()
            return {"message": "Calendly account connected successfully"}
        else:
            raise HTTPException(status_code=404, detail="User not found")
    elif token_response.status_code == 400:
        return {"error": "Invalid authorization code or grant"}
    else:
        return {"error": "Failed to connect Calendly"}


@calendly_router.get("/api/calendly/event-types")
def get_event_types(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(UserModal).filter(UserModal.id == current_user.id).first()
    access_token = user.calendly_access_token if user else None

    if not access_token:
        raise HTTPException(status_code=400, detail="User not connected to Calendly")

    response = requests.get(
        f"{CALENDLY_API_BASE}/users/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    if response.status_code == 200:
        user_info = response.json()
        user_uri = user_info['resource']['uri']

        event_types_response = requests.get(
            f"{CALENDLY_API_BASE}/event_types?user={user_uri}",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if event_types_response.status_code == 200:
            user_events = event_types_response.json()
            events_info = user_events['collection']
            return events_info
        else:
            raise HTTPException(status_code=event_types_response.status_code, detail="Failed to fetch event types")
    else:
        return {"error": "Failed to retrieve user information"}