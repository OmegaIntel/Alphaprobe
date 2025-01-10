from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel
import stripe
import requests
import time
from dotenv import load_dotenv
import os

stripe_router = APIRouter()

# Load environment variables
load_dotenv(dotenv_path=".env")

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class PaymentRequest(BaseModel):
    amount: int
    user_id: str

class StripePaymentDetails(BaseModel):
    payment_status: str
    transaction_id: str
    amount_paid: int

# Auth0 configuration
domain = os.getenv("REACT_APP_AUTH0_DOMAIN")
client_id = os.getenv("REACT_APP_AUTH0_CLIENT_ID")
client_secret = os.getenv("REACT_APP_AUTH0_CLIENT_SECRET")
audience = f"https://{domain}/api/v2/"
token_url = f"https://{domain}/oauth/token"
YOUR_FRONTEND_URL = os.getenv("FRONTEND_URL")

@stripe_router.post("/api/create-payment-intent")
def create_payment_intent(payment_request: PaymentRequest):
    """
    1. Creates a Stripe PaymentIntent.
    2. Stores the (initial) Stripe payment details in Auth0 user_metadata.
    3. Returns the clientSecret for the frontend to confirm the payment.
    """
    try:
        # --- 1) Create the PaymentIntent ---
        try:
            # 1) Create the PaymentIntent
            intent = stripe.PaymentIntent.create(
                amount=payment_request.amount,  # in cents
                currency="usd",
                payment_method_types=["card"]
            )
        except stripe.error.StripeError as e:
            # If PaymentIntent creation itself fails, mark as "failed"
            raise HTTPException(status_code=400, detail=str(e))

        # 2) Derive the payment_status based on Stripe's PaymentIntent status
        intent_status = intent.status  # e.g. "succeeded", "requires_payment_method", etc.
        if intent_status == "succeeded":
            payment_status = "completed"
        elif intent_status in ["requires_action", "requires_payment_method", "processing"]:
            payment_status = "pending"
        else:
            # You can handle other statuses or treat them as "failed" 
            payment_status = "failed"
        
        # You can store more details as needed; e.g. once the payment is confirmed,
        # you'd update "payment_status" to "completed".

        # --- 2) Update the user's metadata in Auth0 ---
        auth0_domain = domain

        # 1) Dynamically get the M2M token from Auth0
        try:
            access_token = get_management_token_cached()
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve Auth0 M2M token: {e}"
            )

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        # We'll store "stripe_payment_details" in user_metadata
        payload = {
            "user_metadata": {
                "stripe_payment_details": {
                    "payment_status": "completed",
                    "transaction_id": intent.id,        # the PaymentIntent ID
                    "amount_paid": payment_request.amount
                }
            }
        }

        response = requests.patch(
            f"https://{auth0_domain}/api/v2/users/{payment_request.user_id}",
            headers=headers,
            json=payload
        )
        if not response.ok:
            # If Auth0 update fails, raise an exception
            raise HTTPException(
                status_code=400,
                detail=f"Failed to update user metadata in Auth0: {response.text}"
            )

        # --- 3) Return the clientSecret to the client ---
        return {"clientSecret": intent.client_secret}

    except stripe.error.StripeError as e:
        # Handle Stripe-specific errors
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@stripe_router.get("/api/stripe-payment-details", response_model=StripePaymentDetails)
async def stripe_payment_details(user_sub: str = Query(...)):
    """
    Fetch user_metadata.stripe_payment_details from Auth0.
    Returns 404 if that metadata is missing or empty.
    """
    # 1) Dynamically get the M2M token from Auth0
    try:
        access_token = get_management_token_cached()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve Auth0 M2M token: {e}"
        )

    # 2) Construct the Auth0 Management API URL
    domain = os.getenv("REACT_APP_AUTH0_DOMAIN", "dev-tenant-testing.us.auth0.com")
    user_metadata_url = f"https://{domain}/api/v2/users/{user_sub}"

    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    # 3) Fetch the user profile from Auth0
    user_response = requests.get(user_metadata_url, headers=headers)
    if user_response.status_code != 200:
        raise HTTPException(
            status_code=user_response.status_code,
            detail="Failed to fetch user metadata"
        )

    # 4) Extract user_metadata.stripe_payment_details
    user_data = user_response.json()
    stripe_payment_details = (
        user_data.get("user_metadata", {}).get("stripe_payment_details", {})
    )

    if not stripe_payment_details:
        # If there's no stripe_payment_details, we return a 404
        raise HTTPException(
            status_code=404,
            detail="Stripe payment details not found for user"
        )

    # 5) Return it
    return StripePaymentDetails(**stripe_payment_details)

@stripe_router.post("/api/create-checkout-session")
def create_checkout_session(payment_request: dict):
    try:
        # Step 1: Create Stripe Checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": "Omega Platform",
                            "description": "Omega platform allows you access to AI-powered investment research",
                        },
                        "unit_amount": 9900,  # Price in cents
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url="https://omegaintelligence.ai/dashboard",
            cancel_url="https://omegaintelligence.ai/payment-cancel",
            metadata={
                "user_id": payment_request["user_id"],  # Track the user in your system
            },
            appearance={  # Customize the appearance
                "theme": "night"  # Enable dark mode
            }
        )

        # Step 2: Return Checkout session URL
        return {"url": session.url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@stripe_router.post("/api/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, "whsec_TUaBfsEiAtZ459cp38tWH2ncxu7Gi4dW")

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]

            # Step 1: Extract user ID from session metadata
            user_id = session["metadata"]["user_id"]

            # Step 2: Update user metadata in Auth0
            auth0_domain = domain
            auth0_token = get_management_token_cached()

            headers = {
                "Authorization": f"Bearer {auth0_token}",
                "Content-Type": "application/json",
            }

            payload = {
                "user_metadata": {
                    "stripe_payment_details": {
                        "payment_status": "completed",
                        "transaction_id": session["payment_intent"],
                        "amount_paid": session["amount_total"],
                    }
                }
            }

            response = requests.patch(
                f"https://{auth0_domain}/api/v2/users/{user_id}",
                headers=headers,
                json=payload,
            )

            if not response.ok:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to update Auth0 metadata: {response.text}",
                )

    except Exception as e:
        print(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail="Webhook error")

    return {"status": "success"}

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
    token_url = f"https://{domain}/oauth/token"
    payload = {
        "client_id": M2M_CLIENT_ID,
        "client_secret": M2M_CLIENT_SECRET,
        "audience": f"https://{domain}/api/v2/",
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