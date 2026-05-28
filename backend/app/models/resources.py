from __future__ import annotations

from pydantic import BaseModel


class ResourceItem(BaseModel):
    id: str
    title: str
    description: str
    url: str | None = None
    phone: str | None = None
    topic: str
    urgency: str
    location: str | None = None


class ResourceResponse(BaseModel):
    data: list[ResourceItem]
