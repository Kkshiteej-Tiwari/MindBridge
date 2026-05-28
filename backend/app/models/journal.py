from __future__ import annotations

from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class JournalAnalysis(BaseModel):
    mood: str
    subject: str
    summary: str
    color: str
    sentiment_score: int = Field(alias="sentimentScore")
    negative: bool

    model_config = {
        "populate_by_name": True,
        "use_enum_values": True,
    }


class JournalEntry(BaseModel):
    id: str
    content: str
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    analysis: JournalAnalysis

    model_config = {
        "populate_by_name": True,
    }


class JournalCreateRequest(BaseModel):
    content: str = Field(default="Write about your day!", min_length=1)


class JournalUpdateRequest(BaseModel):
    content: str = Field(min_length=1)


class JournalListResponse(BaseModel):
    data: list[JournalEntry]


class JournalResponse(BaseModel):
    data: JournalEntry


class HistoryPoint(BaseModel):
    id: str
    created_at: datetime = Field(alias="createdAt")
    sentiment_score: int = Field(alias="sentimentScore")
    mood: str
    color: str

    model_config = {
        "populate_by_name": True,
    }
