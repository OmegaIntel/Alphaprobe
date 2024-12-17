from fastapi import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from db_models.user_thesis import ThesisSurvey, Base, SessionLocal, engine
from pydantic import BaseModel
import uuid

# Initialize FastAPI app
create_thesis_router = APIRouter()

# Create database tables if not already created
Base.metadata.create_all(bind=engine)


# Dependency to get a unique session per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Define the schema for request validation
class ThesisSurveyRequest(BaseModel):

    email_id: str
    thesis_title:str

    question:str
    response:str
    industry_name:str
    industry_code:str
    thesis_industry: str
    thesis_expertise: str
    thesis_characteristics: str
    thesis_trends: str
    thesis_growth: str
    thesis_considerations: str
    thesis_industry_recommendations: str


@create_thesis_router.post("/create_thesis/", status_code=201)
async def create_thesis_survey(request: ThesisSurveyRequest, db: Session = Depends(get_db)):
    """
    Endpoint to create a thesis and its survey data.
    Args:
        request (ThesisSurveyRequest): Incoming validated request data.
        db (Session): Database session (dependency).
    Returns:
        dict: Success message or error.
    """
    try:
        # Generate a unique ID
        thesis_id = str(uuid.uuid4())

        # Map the incoming request to the database model
        thesis_survey = ThesisSurvey(
            id=thesis_id,
            email_id=request.email_id,
            thesis_title=request.thesis_title,

            question = request.question,
            response = request.response,
            industry_name = request.industry_name,
            industry_code = request.industry_code,
            thesis_industry=request.thesis_industry,
            thesis_expertise=request.thesis_expertise,
            thesis_characteristics=request.thesis_characteristics,
            thesis_trends=request.thesis_trends,
            thesis_growth=request.thesis_growth,
            thesis_considerations=request.thesis_considerations,
            thesis_industry_recommendations=request.thesis_industry_recommendations,
        )

        # Add to session and commit
        db.add(thesis_survey)
        db.commit()

        return {"message": "Thesis and survey data created successfully.", "thesis_id": thesis_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating thesis: {e}")