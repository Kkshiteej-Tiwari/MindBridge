from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str
    content: str
    created_at: datetime = Field(alias="createdAt")
    tags: list[str] = []
    risk_level: str | None = Field(default=None, alias="riskLevel")

    model_config = {
        "populate_by_name": True,
    }


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    session_id: str | None = Field(default=None, alias="sessionId")
    history: list[ChatMessage] | None = None

    model_config = {
        "populate_by_name": True,
    }


class ChatReply(BaseModel):
    session_id: str = Field(alias="sessionId")
    reply: str
    risk_level: str = Field(alias="riskLevel")
    tags: list[str]
    suggested_actions: list[str] = Field(alias="suggestedActions")
    resources: list[dict[str, Any]] = []

    model_config = {
        "populate_by_name": True,
    }


class ChatResponse(BaseModel):
    data: ChatReply
