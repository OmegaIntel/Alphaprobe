from fastapi.testclient import TestClient
from app import app 

client = TestClient(app)

def test_linkedin_company_profile():
    input_data = {"url": "https://www.linkedin.com/company/jpmorganchase"}
    response = client.post("/linkedin_company_profile/", json=input_data)
    
    # Check if the status code is as expected
    assert response.status_code in {200, 404}
    
    # Extract the JSON response
    json_response = response.json()
    
    # Verify the keys in the response
    if response.status_code == 200:
        assert "about_us" in json_response
        assert "company_name" in json_response
        assert "company_size_approx" in json_response
    elif response.status_code == 404:
        assert "detail" in json_response
        assert json_response["detail"] == "No data found"


def test_pitchbook_company_profile():
    input_data = {"url": "https://pitchbook.com/profiles/advisor/55545-67"}
    response = client.post("/pitchbook_company_profile/", json=input_data)
    assert response.status_code in {200, 500}  
    assert "content" in response.json() or "error" in response.json()
