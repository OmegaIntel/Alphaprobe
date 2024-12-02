import sys
import os

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(project_root)
from api.api_create_thesis import create_thesis_router, ThesisSurveyRequest

import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from sqlalchemy.orm import Session

from fastapi import FastAPI


# Mock database setup
@pytest.fixture
def mock_db():
    with patch("api.api_create_thesis.SessionLocal") as mock_session:
        db = MagicMock(spec=Session)
        mock_session.return_value = db
        yield db


app = FastAPI()
app.include_router(create_thesis_router)

client = TestClient(app)

# Mock data for testing
@pytest.fixture
def thesis_request_data():
    return {
        "email_id": "john@gmail.com",
        "thesis_title": "The Rise of AI in Healthcare",
        "question": "How can AI revolutionize healthcare?",
        "response": "AI can improve diagnosis, accelerate drug discovery, and personalize treatments.",
        "industry_name": "Healthcare",
        "industry_code": "621110",
        "thesis_industry": "Healthcare",
        "thesis_expertise": "Artificial Intelligence, Machine Learning, Medical Imaging",
        "thesis_characteristics": "High Growth, Disruptive Technology, Ethical Considerations",
        "thesis_trends": "Increasing Adoption of AI Tools, Data Privacy and Security Concerns",
        "thesis_growth": "Significant Growth Potential",
        "thesis_considerations": "Data Quality, Ethical Implications, Integration Challenges",
        "thesis_industry_recommendations": "Invest in AI research, Foster tech collaborations, Develop guidelines",
    }

# Test cases
def test_create_thesis_success(mock_db, thesis_request_data):
    """Test successful creation of a thesis."""
    # Mock the database commit and add
    mock_db.add.return_value = None
    mock_db.commit.return_value = None

    # Send a POST request
    response = client.post("/create_thesis/", json=thesis_request_data)

    # Assert the response status and content
    assert response.status_code == 201
    response_data = response.json()
    assert response_data["message"] == "Thesis and survey data created successfully."
    assert "thesis_id" in response_data

    # Assert that the database commit was called
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()

def test_create_thesis_db_error(mock_db, thesis_request_data):
    """Test handling of database errors."""
    # Mock a database exception during commit
    mock_db.commit.side_effect = Exception("Database error")

    # Send a POST request
    response = client.post("/create_thesis/", json=thesis_request_data)

    # Assert the response status and content
    assert response.status_code == 500
    assert "Error creating thesis" in response.json()["detail"]

    # Assert that rollback was called
    #mock_db.rollback.assert_called_once()

def test_create_thesis_validation_error():
    """Test validation error for invalid request data."""
    # Invalid data (missing required field)
    invalid_data = {
        "email_id": "john@gmail.com",
        # Missing "thesis_title"
        "question": "How can AI revolutionize healthcare?",
        "response": "AI can improve diagnosis, accelerate drug discovery, and personalize treatments.",
        "industry_name": "Healthcare",
        "industry_code": "621110",
    }

    # Send a POST request
    response = client.post("/create_thesis/", json=invalid_data)

    # Assert the response status and content
    assert response.status_code == 422  # Unprocessable Entity
    assert "thesis_title" in response.json()["detail"][0]["loc"]

