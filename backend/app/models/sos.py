from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from .resources import ResourceItem


class SOSRouteRequest(BaseModel):
    country: str = "Global"
    risk_level: Literal["neutral", "elevated", "distressed", "crisis"] = "crisis"


class SOSAction(BaseModel):
    label: str
    description: str
    href: str
    tone: Literal["calm", "warning", "urgent"] = "calm"


class SOSStep(BaseModel):
    title: str
    description: str


class SOSRouteResponse(BaseModel):
    title: str
    summary: str
    country: str
    risk_level: str
    primary_action: SOSAction
    steps: list[SOSStep] = Field(default_factory=list)
    resources: list[ResourceItem] = Field(default_factory=list)
