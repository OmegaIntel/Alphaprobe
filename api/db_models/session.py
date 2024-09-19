from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database URL, adjust to your specific database (Postgres, MySQL, SQLite, etc.)
DATABASE_URL = f"mysql+mysqldb://{os.getenv('DATABASE_USER_NAME')}:{os.getenv('DATABASE_PASSWORD')}@{os.getenv('DATABASE_HOST')}:{os.getenv('DATABASE_PORT')}/{os.getenv('DATABASE_NAME')}"

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create a base class for our models
Base = declarative_base()

# Create a session factory bound to our engine
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency function to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
