from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class PeerMessage(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime = Field(alias="createdAt")

    model_config = {
        "populate_by_name": True,
    }


class PeerThread(BaseModel):
    id: str
    topic: str
    status: str
    last_updated: datetime = Field(alias="lastUpdated")
    messages: list[PeerMessage]

    model_config = {
        "populate_by_name": True,
    }


class PeerThreadSummary(BaseModel):
    id: str
    topic: str
    status: str
    last_updated: datetime = Field(alias="lastUpdated")
    preview: str

    model_config = {
        "populate_by_name": True,
    }


class PeerThreadsResponse(BaseModel):
    data: list[PeerThreadSummary]


class PeerSendRequest(BaseModel):
    message: str = Field(min_length=1)
    thread_id: str | None = Field(default=None, alias="threadId")
    topic: str = "General"

    model_config = {
        "populate_by_name": True,
    }


class PeerThreadResponse(BaseModel):
    data: PeerThread
