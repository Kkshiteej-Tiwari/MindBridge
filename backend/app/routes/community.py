from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..models.community import (
    CommunityFeedResponse,
    CommunityPostRequest,
    CommunityPostResponse,
    CommunityReactRequest,
)
from ..services.community_store import add_reaction, create_post, list_posts

router = APIRouter(prefix="/community", tags=["community"])


@router.get("/feed", response_model=CommunityFeedResponse)
def read_feed(topic: str | None = None) -> CommunityFeedResponse:
    return CommunityFeedResponse(data=list_posts(topic))


@router.post("/post", response_model=CommunityPostResponse)
def create_community_post(payload: CommunityPostRequest) -> CommunityPostResponse:
    post = create_post(payload.content, payload.topic, payload.mood)
    return CommunityPostResponse(data=post)


@router.post("/react", response_model=CommunityPostResponse)
def react_to_post(payload: CommunityReactRequest) -> CommunityPostResponse:
    try:
        post = add_reaction(payload.post_id, payload.reaction)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Post not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return CommunityPostResponse(data=post)
