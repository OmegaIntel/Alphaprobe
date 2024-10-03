from fastapi import  APIRouter,HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
import requests
import os
from sqlalchemy.orm import Session
from db_models.session import get_db
from db_models.users import User
from dotenv import load_dotenv

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
@calendly_router.get("/connect-calendly")
def connect_calendly(user_id: str, db: Session = Depends(get_db)):
    authorization_url = (
        f"{CALENDLY_AUTH_URL}?client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}&response_type=code&scope=default&user_id={user_id}"
    )
    return {'url':authorization_url}

@calendly_router.get("/calendly/callback")
def calendly_callback(user_id: str,code: str, db: Session = Depends(get_db)):
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
    print('token_response',token_response.json())
    # return {"message": "Calendly account connected successfully"}
    if token_response.status_code == 200:
        access_token = token_response.json().get("access_token")
        refresh_token = token_response.json().get("refresh_token")

        # Update user with the new access token
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.calendly_access_token = access_token
            user.calendly_refresh_token = refresh_token
            db.commit()
            return {"message": "Calendly account connected successfully"}
        else:
            raise HTTPException(status_code=404, detail="User not found")
    else:
        return {"error": "Failed to connect Calendly"}


@calendly_router.get("/calendly/user/{user_id}")
def get_user_info(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    access_token = user.calendly_access_token if user else None

    if not access_token:
        return {"error": "User not connected to Calendly"}

    response = requests.get(
        f"{CALENDLY_API_BASE}/users/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    print(response.json())
    return response.json()