from __future__ import annotations

from fastapi import APIRouter

from ..models.chat import ChatRequest, ChatResponse
from ..services.chat import generate_reply

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/respond", response_model=ChatResponse)
def respond(payload: ChatRequest) -> ChatResponse:
    reply = generate_reply(payload.message, payload.session_id, payload.history)
    return ChatResponse(data=reply)
