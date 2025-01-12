import os
import httpx
import requests
from fastapi import HTTPException, Depends, APIRouter
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from jose import jwt, JWTError
from dotenv import load_dotenv
import time


auth_router = APIRouter()
load_dotenv()
security = HTTPBearer(auto_error=False)

# Replace these with your Auth0 details
AUTH0_DOMAIN = os.getenv("REACT_APP_AUTH0_DOMAIN")
CLIENT_ID = os.getenv("REACT_APP_AUTH0_CLIENT_ID")
CLIENT_SECRET = os.getenv("REACT_APP_AUTH0_CLIENT_SECRET")
API_AUDIENCE = os.getenv("REACT_APP_AUTH0_API_AUDIENCE")
ALGORITHMS = ["RS256"]

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str

_management_token = None
_token_expiry = 0

M2M_CLIENT_ID = os.getenv("M2M_CLIENT_ID")
M2M_CLIENT_SECRET = os.getenv("M2M_CLIENT_SECRET")

def get_management_token_cached():
    global _management_token, _token_expiry

    # If we have a valid token not yet expired, reuse it
    if _management_token and time.time() < _token_expiry:
        return _management_token

    # Otherwise, request a new one
    token_url = f"https://{AUTH0_DOMAIN}/oauth/token"
    payload = {
        "client_id": M2M_CLIENT_ID,
        "client_secret": M2M_CLIENT_SECRET,
        "audience": API_AUDIENCE,
        "grant_type": "client_credentials"
    }
    resp = requests.post(token_url, json=payload)
    resp.raise_for_status()
    data = resp.json()

    _management_token = data["access_token"]
    # Auth0 might return "expires_in" (like 86400 seconds). Subtract ~60 for buffer.
    expires_in = data.get("expires_in", 3600)
    _token_expiry = time.time() + expires_in - 60

    return _management_token


@auth_router.post("/api/login-auth")
async def login(credentials: LoginRequest):
    payload = {
        'grant_type': 'password',
        'username': credentials.username,
        'password': credentials.password,
        'audience': API_AUDIENCE,
        'scope': 'openid profile email',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'realm': 'Username-Password-Authentication'
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(f"https://{AUTH0_DOMAIN}/oauth/token", json=payload)
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    tokens = response.json()
    # Return tokens to the frontend
    return tokens

@auth_router.post("/api/register-auth")
async def register(user: RegisterRequest):
    # Obtain a Management API token
    mgmt_token = get_management_token_cached()

    # Prepare the user creation payload
    user_payload = {
        "email": user.email,
        "password": user.password,
        "connection": "Username-Password-Authentication",  # Replace if using a different connection
        # Add other user metadata as needed
    }

    headers = {
        "Authorization": f"Bearer {mgmt_token}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://{AUTH0_DOMAIN}/api/v2/users",
            json=user_payload,
            headers=headers
        )

    if response.status_code not in (200, 201):
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return {"message": "User registered successfully", "user": response.json()}

@auth_router.get("/api/userinfo")
async def fetch_userinfo(authorization: str = Depends(HTTPBearer())):
    token = authorization.credentials
    async with httpx.AsyncClient() as client:
        response = await client.get(f"https://{AUTH0_DOMAIN}/userinfo", headers={"Authorization": f"Bearer {token}"})
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch user info")
        return response.json()