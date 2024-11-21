from fastapi import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from db_models.user_thesis import  SessionLocal,retreive_theses_with_query

retrieve_thesis_router = APIRouter()

# Dependency to get a unique session per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@retrieve_thesis_router.get("/retrieve_thesis/")
async def retrieve_thesis(session_id: int,email_id: str, db: Session = Depends(get_db)):
    """
    API endpoint to retrieve theses with survey data based on session ID.

    Args:
        session_id (int): The session ID to filter results.
        db (Session): Database session.

    Returns:
        dict: Retrieved thesis and survey data.
    """
    try:
        # Retrieve all theses and filter by session ID
        
        filtered_theses = retreive_theses_with_query(id = session_id,email_id=email_id)

        if not filtered_theses:
            raise HTTPException(status_code=404, detail="No theses found for the provided session ID.")

        return {"theses": filtered_theses}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving theses: {e}")
