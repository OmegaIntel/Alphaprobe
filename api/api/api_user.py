from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from fastapi.security import OAuth2AuthorizationCodeBearer
import jwt
import requests
from typing import Annotated
from sqlalchemy.orm import Session
from db_models.users import User as DbUser
from db_models.session import get_db

import os

# Environment variables
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "your-auth0-domain")
API_AUDIENCE = os.getenv("AUTH0_API_AUDIENCE", "your-api-audience")
ALGORITHMS = ["RS256"]

# OAuth2 configuration
auth0_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl=f"https://{AUTH0_DOMAIN}/authorize",
    tokenUrl=f"https://{AUTH0_DOMAIN}/oauth/token"
)

# Router initialization
user_router = APIRouter()

# Pydantic models
class User(BaseModel):
    id: str
    email: str
    is_admin: bool

    class Config:
        from_attributes = True

def get_auth0_public_key():
    """Fetch the Auth0 public keys for token verification."""
    jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
    response = requests.get(jwks_url)
    response.raise_for_status()
    return response.json()["keys"]

def verify_auth0_token(token: str) -> dict:
    """Verify and decode the JWT issued by Auth0."""
    jwks = get_auth0_public_key()
    unverified_header = jwt.get_unverified_header(token)

    rsa_key = {}
    for key in jwks:
        if key["kid"] == unverified_header["kid"]:
            rsa_key = {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"]
            }
            break

    if not rsa_key:
        raise HTTPException(status_code=401, detail="Unable to find appropriate key")

    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=ALGORITHMS,
            audience=API_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTClaimsError:
        raise HTTPException(status_code=401, detail="Invalid claims")
    except Exception:
        raise HTTPException(status_code=401, detail="Unable to parse authentication token")

async def get_current_user(token: Annotated[str, Depends(auth0_scheme)], db: Session = Depends(get_db)) -> User:
    """Extract the user from the Auth0 token."""
    payload = verify_auth0_token(token)
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Fetch user details from the database
    user = db.query(DbUser).filter(DbUser.email == email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return User(id=str(user.id), email=user.email, is_admin=user.is_master_admin)

# API route for login (redirects to Auth0)
@user_router.get("/api/token")
async def login():
    """Redirect users to the Auth0 login page."""
    return {
        "auth_url": f"https://{AUTH0_DOMAIN}/authorize"
                    f"?audience={API_AUDIENCE}"
                    f"&response_type=code"
                    f"&client_id={os.getenv('AUTH0_CLIENT_ID')}"
                    f"&redirect_uri=http://localhost:8000/api/callback"
    }

# Callback endpoint for handling Auth0 login response
@user_router.get("/api/callback")
async def callback(request: Request):
    """Handle the callback from Auth0 after login."""
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code not found")

    token_url = f"https://{AUTH0_DOMAIN}/oauth/token"
    headers = {"Content-Type": "application/json"}
    payload = {
        "grant_type": "authorization_code",
        "client_id": os.getenv("AUTH0_CLIENT_ID"),
        "client_secret": os.getenv("AUTH0_CLIENT_SECRET"),
        "code": code,
        "redirect_uri": "http://localhost:8000/api/callback"
    }

    response = requests.post(token_url, json=payload, headers=headers)
    response_data = response.json()

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response_data)

    return {"access_token": response_data["access_token"]}

# Protected endpoint to fetch user details
@user_router.get("/api/users/me")
async def read_users_me(current_user: Annotated[User, Depends(get_current_user)]):
    """Return the current user's information."""
    return current_user
