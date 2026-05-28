from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CommunityPost(BaseModel):
    id: str
    content: str
    topic: str
    mood: str
    created_at: datetime = Field(alias="createdAt")
    reactions: dict[str, int]
    support_count: int = Field(alias="supportCount")
    flagged: bool
    visibility: str
    anon_name: str = Field(alias="anonName")

    model_config = {
        "populate_by_name": True,
    }


class CommunityPostRequest(BaseModel):
    content: str = Field(min_length=1)
    topic: str = "General"
    mood: str = "neutral"


class CommunityReactRequest(BaseModel):
    post_id: str = Field(alias="postId")
    reaction: str

    model_config = {
        "populate_by_name": True,
    }


class CommunityFeedResponse(BaseModel):
    data: list[CommunityPost]


class CommunityPostResponse(BaseModel):
    data: CommunityPost
