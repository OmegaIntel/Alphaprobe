
"""

from fastapi import APIRouter,HTTPException
from pydantic import BaseModel
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv
import os
# Load environment variables from .env file
load_dotenv()

SMTP_SERVER=os.environ["SMTP_SERVER"]
SMTP_PORT=os.environ["SMTP_PORT"]
SMTP_USERNAME=os.environ["SMTP_USERNAME"]
SMTP_PASSWORD=os.environ["SMTP_PASSWORD"]
SENDER_EMAIL=os.environ["SENDER_EMAIL"]

# FastAPI app instance
Email_router = APIRouter()

class EmailSchema(BaseModel):
    email: str
    title: str
    description: str

# Utility function to send email
def send_email(to_email: str, subject: str, body: str):
    try:
        # Setup the MIME message
        msg = MIMEMultipart()
        msg["From"] = SENDER_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        # Connect to the SMTP server
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls() 
            server.login(SMTP_USERNAME, SMTP_PASSWORD) 
            text = msg.as_string()

            # Send the email
            server.sendmail(SENDER_EMAIL, to_email, text)

        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

# FastAPI route to send email
@Email_router.post("/api/send-email/")
def send_email_endpoint(email_data: EmailSchema):
    to_email = email_data.email
    subject = email_data.title
    body = email_data.description

    # Send the email
    if send_email(to_email, subject, body):
        return {"message": "Email sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email")
"""
