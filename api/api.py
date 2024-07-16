from fastapi import APIRouter, HTTPException
from api.models.chat_request import ChatRequest
from api.models.chat_response import ChatResponse

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    user_message = request.message
    # Here you would integrate your chat logic. For example, using an AI model.
    # For demonstration purposes, we'll echo back the user's message.
    ai_response = f"Echo: {user_message}"
    return ChatResponse(response=ai_response)
