from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional
from db_models.session import get_db
from db_models.contact_us import ContactUs
import logging
import time
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI Router
contact_us_router = APIRouter()

# Pydantic Model for Request Validation
class ContactUsRequest(BaseModel):
    name: str
    email: EmailStr
    phone_number: Optional[str] = None
    message: str

@contact_us_router.post("/api/contact-us")
async def submit_contact_form(request: ContactUsRequest, req: Request, db: Session = Depends(get_db)):
    """
    API endpoint to submit the contact form.
    """
    request_id = str(uuid.uuid4())
    logger.info(f"Request {request_id}: Processing contact form submission for {request.email}")
    
    # Extract client info for logging
    client_host = req.client.host if req.client else "unknown"
    
    try:
        # Create new contact entry
        new_entry = ContactUs(
            name=request.name,
            email=request.email,
            phone_number=request.phone_number,
            message=request.message
        )
        
        logger.info(f"Request {request_id}: Prepared contact entry for {request.email}")
        
        # Add to session
        db.add(new_entry)
        logger.info(f"Request {request_id}: Added to session")
        
        # Commit with retry logic
        max_retries = 3
        retry_count = 0
        
        while True:
            try:
                start_time = time.time()
                db.commit()
                end_time = time.time()
                logger.info(f"Request {request_id}: DB commit successful in {end_time - start_time:.2f}s")
                break
            except Exception as e:
                retry_count += 1
                logger.warning(f"Request {request_id}: Commit attempt {retry_count} failed: {str(e)}")
                
                if retry_count >= max_retries:
                    logger.error(f"Request {request_id}: All commit attempts failed, raising exception")
                    raise
                
                # Wait before retrying
                time.sleep(1)
                
                # Rollback and recreate the entry
                db.rollback()
                new_entry = ContactUs(
                    name=request.name,
                    email=request.email,
                    phone_number=request.phone_number,
                    message=request.message
                )
                db.add(new_entry)
        
        # Refresh to get the ID
        db.refresh(new_entry)
        logger.info(f"Request {request_id}: Successfully processed contact form for {request.email}")

        return {
            "message": "Your message has been received. We will contact you soon.",
            "success": True,
            "id": str(new_entry.id) 
        }
    
    except Exception as e:
        logger.error(f"Request {request_id}: Error processing contact form from {client_host}: {str(e)}")
        db.rollback()
        
        # Check for specific database errors
        error_message = str(e)
        if "Lost connection" in error_message:
            raise HTTPException(
                status_code=503,
                detail="Database connection issue. Please try again in a few moments."
            )
        elif "timeout" in error_message.lower():
            raise HTTPException(
                status_code=504,
                detail="Database operation timed out. Please try again."
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"An error occurred while processing your request: {str(e)}"
            )