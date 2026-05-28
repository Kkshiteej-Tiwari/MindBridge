from __future__ import annotations

import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from ..models.chat import ChatRequest, ChatResponse
from ..services.chat import generate_reply, stream_reply_chunks

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/respond", response_model=ChatResponse)
def respond(payload: ChatRequest) -> ChatResponse:
    reply = generate_reply(payload.message, payload.session_id, payload.history)
    return ChatResponse(data=reply)


@router.post("/respond/stream")
def respond_stream(payload: ChatRequest) -> StreamingResponse:
    def event_stream():
        for event in stream_reply_chunks(payload.message, payload.session_id, payload.history):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
