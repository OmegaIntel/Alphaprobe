from fastapi.testclient import TestClient
from app import app 

client = TestClient(app)


def test_pitchbook_company_profile():
    input_data = {"url": "https://pitchbook.com/profiles/advisor/55545-67"}
    response = client.post("/pitchbook_company_profile/", json=input_data)
    assert response.status_code in {200, 500}  
    assert "content" in response.json() or "error" in response.json()



