import sys
import os
import pytest
from unittest.mock import patch, MagicMock
import pandas as pd
import json

# Add project root to the path for imports
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(project_root)

from db_models.user_thesis import retrieve_theses_with_query

# Fixture for mocking the database engine
@pytest.fixture
def mock_engine():
    with patch("db_models.user_thesis.engine.connect") as mock_connect:
        mock_connection = MagicMock()
        mock_connect.return_value.__enter__.return_value = mock_connection
        yield mock_connection


def test_1(mock_engine):
    """Test case for retrieving a thesis about Electric Vehicles."""
    # Mock database response
    mock_engine.execute.return_value.fetchall.return_value = [
        (
            9, "sample@gmail.com", "Electric Vehicle", 1732271260000,
            1732271260000, "What is the future of electric vehicles?",
            "Electric vehicles are rapidly gaining popularity due to increasing environmental concerns and technological advancements.",
            "Automotive", "336111", "Automotive",
            "Electric Vehicles, Battery Technology, Autonomous Vehicles",
            "High Growth, Disruptive Technology, Environmental Impact",
            "Increasing Adoption Rates, Government Incentives, Infrastructure Development",
            "Significant Growth Potential, Driven by Technological Advancements and Changing Consumer Preferences",
            "Battery Range, Charging Infrastructure, Cost of Ownership, Policy and Regulatory Environment",
            "Invest in Battery Technology, Expand Charging Infrastructure, Develop Autonomous Vehicle Capabilities, Focus on Sustainable Sourcing and Manufacturing"
        )
    ]
    mock_engine.execute.return_value.keys.return_value = [
        "id", "email_id", "thesis_title", "created_at", "updated_at", "question",
        "response", "industry_name", "industry_code", "thesis_industry",
        "thesis_expertise", "thesis_characteristics", "thesis_trends",
        "thesis_growth", "thesis_considerations", "thesis_industry_recommendations",
    ]

    # Test data
    email_id = "sample@gmail.com"
    
    # Call the function
    result = retrieve_theses_with_query(email_id)

    # Assert that the email_id is present in the result
    assert any(item["email_id"] == email_id for item in result)


def test_2(mock_engine):
    """Test case for retrieving a thesis about AI in Healthcare."""
    # Mock database response
    mock_engine.execute.return_value.fetchall.return_value = [
        (
            5633, "sample@gmail.com", "The Rise of AI in Healthcare", 1732273497000,
            1732273497000, "How can AI revolutionize healthcare?",
            "AI has the potential to transform healthcare by improving diagnosis accuracy, accelerating drug discovery, and personalizing treatment plans. By analyzing vast amounts of medical data, AI algorithms can identify patterns and insights that may be missed by",
            "Healthcare", "NAICS 621110", "Healthcare",
            "Artificial Intelligence, Machine Learning, Medical Imaging",
            "High Growth, Disruptive Technology, Ethical Considerations",
            "Increasing Adoption of AI Tools, Data Privacy and Security Concerns, Regulatory Framework Development",
            "Significant Growth Potential, Driven by Technological Advancements and Aging Population",
            "Data Quality and Bias, Ethical Implications, Integration with Existing Healthcare Systems",
            "Invest in AI Research and Development, Foster Collaboration between Healthcare Providers and Tech Companies, Prioritize Data Privacy and Security, Develop Ethical Guidelines for AI in Healthcare"
        )
    ]
    mock_engine.execute.return_value.keys.return_value = [
        "id", "email_id", "thesis_title", "created_at", "updated_at", "question",
        "response", "industry_name", "industry_code", "thesis_industry",
        "thesis_expertise", "thesis_characteristics", "thesis_trends",
        "thesis_growth", "thesis_considerations", "thesis_industry_recommendations",
    ]

    # Test data
    email_id = "sample@gmail.com"


    result = retrieve_theses_with_query(email_id)

    # Assert that the email_id is present in the result
    assert any(item["email_id"] == email_id for item in result)
