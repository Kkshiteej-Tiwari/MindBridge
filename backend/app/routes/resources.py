from __future__ import annotations

from fastapi import APIRouter

from ..models.resources import ResourceResponse
from ..services.resources import get_crisis_resources, get_resources

router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("", response_model=ResourceResponse)
def read_resources(topic: str | None = None) -> ResourceResponse:
    return ResourceResponse(data=get_resources(topic))


@router.get("/crisis", response_model=ResourceResponse)
def read_crisis_resources(country: str | None = "India") -> ResourceResponse:
    return ResourceResponse(data=get_crisis_resources(country))
