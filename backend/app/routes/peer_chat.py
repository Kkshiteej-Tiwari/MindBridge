from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..models.peer_chat import PeerSendRequest, PeerThreadResponse, PeerThreadsResponse
from ..services.peer_chat_store import get_thread, list_threads, send_message

router = APIRouter(prefix="/community/peer", tags=["community"])


@router.get("/threads", response_model=PeerThreadsResponse)
def read_threads() -> PeerThreadsResponse:
    return PeerThreadsResponse(data=list_threads())


@router.get("/{thread_id}", response_model=PeerThreadResponse)
def read_thread(thread_id: str) -> PeerThreadResponse:
    thread = get_thread(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    return PeerThreadResponse(data=thread)


@router.post("/send", response_model=PeerThreadResponse)
def send_peer_message(payload: PeerSendRequest) -> PeerThreadResponse:
    thread = send_message(payload.message, payload.thread_id, payload.topic)
    return PeerThreadResponse(data=thread)
