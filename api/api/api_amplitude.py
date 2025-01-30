from fastapi import APIRouter, Request
import requests

amplitude_router = APIRouter()

# Your Amplitude API Key
AMPLITUDE_API_KEY = "b07260e647c7c3cc3c25aac93aa17db8"

@amplitude_router.post("/api/analytics")
async def forward_to_amplitude(request: Request):
    try:
        # Get the incoming JSON data
        event_data = await request.json()

        # Wrap the event data into the required format
        payload = {
            "api_key": AMPLITUDE_API_KEY,
            "events": [event_data],
        }

        # Forward the request to Amplitude
        amplitude_response = requests.post(
            "https://api.amplitude.com/2/httpapi",
            json=payload,
            headers={"Content-Type": "application/json"},
        )

        # Return Amplitude's response back to the client
        return {
            "status": amplitude_response.status_code,
            "data": amplitude_response.json(),
        }
    except Exception as e:
        print("Error:", str(e))
        return {"error": str(e)}
