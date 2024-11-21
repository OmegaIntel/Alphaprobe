from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy import Column, Integer, String, Text, DateTime,text
from datetime import datetime
import os
from dotenv import load_dotenv
import pandas as pd

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_USER_NAME = os.getenv('DATABASE_USER_NAME')
DATABASE_PASSWORD = os.getenv('DATABASE_PASSWORD')
DATABASE_HOST = os.getenv('DATABASE_HOST')
DATABASE_PORT = int(os.getenv('DATABASE_PORT'))
DATABASE_NAME = os.getenv('DATABASE_NAME')

DATABASE_URL = f"mysql+mysqldb://{DATABASE_USER_NAME}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"

# SQLAlchemy setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base for declarative models
Base = declarative_base()


# Thesis Survey table
class ThesisSurvey(Base):
    __tablename__ = "thesis_surveys"


    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(String(255), nullable=False)  # Add 
    thesis_title = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    question = Column(String(255), nullable=False)
    response = Column(String(255), nullable=False)
    industry_name = Column(String(255), nullable=False)
    industry_code = Column(String(255), nullable=False)
    thesis_industry = Column(String(255), nullable=False)
    thesis_expertise = Column(String(255), nullable=False)
    thesis_characteristics = Column(Text, nullable=False)
    thesis_trends = Column(Text, nullable=False)
    thesis_growth = Column(Text, nullable=False)
    thesis_considerations = Column(Text, nullable=False)
    thesis_industry_recommendations = Column(Text, nullable=False)



def retreive_theses_with_query(id, email_id):
    query = f"SELECT * FROM thesis_surveys where id = {id} and email_id = '{email_id}';"

# Execute the query
    with engine.connect() as connection:
        result = connection.execute(text(query))

        df = pd.DataFrame(result.fetchall(), columns=result.keys())

        return df.to_json(orient='records', lines=False)

# Create database tables
Base.metadata.create_all(bind=engine)
