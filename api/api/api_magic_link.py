import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from db_models.session import get_db
from db_models.request_document import RequestDocuments
from sqlalchemy.orm import Session
from uuid import UUID
import uuid
from email.message import EmailMessage
import smtplib
from dotenv import load_dotenv
from api.api_chat_session import sanitize_class_name_nocap

# Load environment variables from .env file
load_dotenv()

magic_link_router = APIRouter()

class MagicLinkRequest(BaseModel):
    deal_id: UUID
    email: EmailStr

# Function to send the magic link email with a nice HTML template
def send_magic_link_email(email: str, token: str, base_url: str):
    # Prepare the email content with HTML template
    link = f"{base_url}/guest/{token}"
    
    subject = "You are invited to collaborate"
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333;">You're invited to collaborate on a deal</h2>
            <p>Hello,</p>
            <p>We would like to invite you to collaborate on a deal. Please click the link below to access it:</p>
            <a href="{link}" style="background-color: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Access Your Deal</a>
            <p style="margin-top: 20px;">If the button doesn't work, you can copy and paste the following link into your browser:</p>
            <p><a href="{link}">{link}</a></p>
            <p>Thank you,</p>
            <p>The Team</p>
        </div>
    </body>
    </html>
    """

    # Prepare the email message
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = os.getenv('SENDER_EMAIL')  # Use sender email from the environment
    msg['To'] = email
    msg.set_content(f"Click the link to access your deal: {link}")  # Fallback for clients that don't support HTML
    msg.add_alternative(html_content, subtype='html')  # HTML version

    # Fetch SMTP details from environment variables
    smtp_server = os.getenv('SMTP_SERVER')
    smtp_port = int(os.getenv('SMTP_PORT'))
    smtp_username = os.getenv('SMTP_USERNAME')
    smtp_password = os.getenv('SMTP_PASSWORD')

    # Send the email via SMTP
    with smtplib.SMTP(smtp_server, smtp_port) as smtp:
        smtp.starttls()
        smtp.login(smtp_username, smtp_password)
        smtp.send_message(msg)

@magic_link_router.post("/api/magic_link/", response_model=None)
def create_magic_link(data: MagicLinkRequest, db: Session = Depends(get_db)):
    # Generate a unique token
    token = (uuid.uuid4())
    
    # Save the deal ID and token in the database
    request_doc_obj = RequestDocuments(deal_id=data.deal_id, token=token)
    db.add(request_doc_obj)
    db.commit()
    db.refresh(request_doc_obj)
    
    # Base URL for the frontend
    base_url = os.getenv('FRONTEND_URL')

    # Send the magic link email
    send_magic_link_email(data.email, token, base_url)
    
    return {"message": "Magic link sent to the provided email"}

@magic_link_router.get("/api/deal_id/", response_model=None)
def get_deal_id(token: str, db: Session = Depends(get_db)):
    # Query the database for the deal ID based on the token
    token = sanitize_class_name_nocap(token)
    
    request_doc = db.query(RequestDocuments).filter_by(token=str(token)).first()
    if not request_doc:
        raise HTTPException(status_code=404, detail="Invalid token")
    
    return {"deal_id": request_doc.deal_id}
