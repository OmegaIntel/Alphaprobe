from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

Base = declarative_base()


# Thesis Survey table
class ThesisSurvey(Base):
    __tablename__ = "thesis_surveys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)  # Add ForeignKey if  have a User table
    title = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # thesis_id = Column(Integer, nullable=False)
    industry = Column(String(255), nullable=False)
    expertise = Column(String(255), nullable=False)
    characteristics = Column(Text, nullable=False)
    trends = Column(Text, nullable=False)
    growth = Column(Text, nullable=False)
    considerations = Column(Text, nullable=False)
    industry_recommendations = Column(Text, nullable=False)



DATABASE_USER_NAME = os.getenv('DATABASE_USER_NAME')
DATABASE_PASSWORD = os.getenv('DATABASE_PASSWORD')
DATABASE_HOST = os.getenv('DATABASE_HOST')
DATABASE_PORT = int(os.getenv('DATABASE_PORT'))
DATABASE_NAME = os.getenv('DATABASE_NAME')

DATABASE_URL = f"mysql+mysqldb://{DATABASE_USER_NAME}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"
# this is the Alembic Config object, which provides
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create all tables
# Base.metadata.create_all(bind=engine)

# Example functions
def create_thesis_with_survey(session, thesis_data, survey_data):
    """
    Create a thesis along with its survey data.

    Args:
        session: SQLAlchemy session.
        thesis_data (dict): Data for the thesis.
        survey_data (dict): Survey data linked to the thesis.
    """
    try:
        print("thesis_data :",thesis_data)
        print("survey_data :",survey_data)
        thesis_survey = ThesisSurvey()
        thesis_survey.id = thesis_data["id"]
        thesis_survey.user_id = thesis_data["user_id"]
        thesis_survey.title = thesis_data["title"]
        thesis_survey.created_at = thesis_data["created_at"]
        thesis_survey.updated_at = thesis_data["updated_at"]

        thesis_survey.industry = survey_data["industry"]
        thesis_survey.expertise = survey_data["expertise"]
        thesis_survey.characteristics = survey_data["characteristics"]
        thesis_survey.trends = survey_data["trends"]
        thesis_survey.growth = survey_data["growth"]
        thesis_survey.considerations = survey_data["considerations"]
        thesis_survey.industry_recommendations = survey_data["industry_recommendations"]
        
        
        print("survey:",thesis_survey)
        
        session.add(thesis_survey)
        session.commit()
        print("Thesis and survey data inserted successfully.")
    except Exception as e:
        session.rollback()
        print(f"Error inserting data: {e}")
    finally:
        session.close()

def retrieve_theses_with_surveys(session):
    """
    Retrieve all theses along with their survey data.

    Args:
        session: SQLAlchemy session.

    Returns:
        list: List of theses with survey data.
    """
    try:
        theses = session.query(ThesisSurvey).all()
        print('retrieve theses:',theses)
        result = []
        for thesis in theses:
            thesis_data = {
                "id": thesis.id,
                "user_id": thesis.user_id,
                "title": thesis.title,
                "created_at": thesis.created_at,
                "updated_at": thesis.updated_at,
                "survey": {
                    "industry": thesis.industry,
                    "expertise": thesis.expertise,
                    "characteristics": thesis.characteristics,
                    "trends": thesis.trends,
                    "growth": thesis.growth,
                    "considerations": thesis.considerations,
                    "industry_recommendations": thesis.industry_recommendations,
                } if thesis else None,
            }
            result.append(thesis_data)
        return result
    except Exception as e:
        print(f"Error retrieving data: {e}")
        return []
    finally:
        session.close()

# Example usage
if __name__ == "__main__":
    session = SessionLocal()

    # Create example data
    thesis_data = {
        "id" :56,
        "user_id": 1,
        "title": "The Impact of AI on Manufacturing",
        "created_at":datetime.now(),
        "updated_at":datetime.now()
    }
    survey_data = {
        "industry": "Manufacturing",
        "expertise": "Artificial Intelligence",
        "characteristics": "Automation, Cost Efficiency",
        "trends": "Increasing adoption of AI",
        "growth": "Rapid tech changes",
        "considerations": "Regulations, Ethical Concerns",
        "industry_recommendations": "Invest in AI research and workforce training"
    }

    # Insert data
    create_thesis_with_survey(session, thesis_data, survey_data)

    # Retrieve data
    session = SessionLocal()
    all_theses = retrieve_theses_with_surveys(session)
    print("All Theses with Surveys:")
    for thesis in all_theses:
        print(thesis)
