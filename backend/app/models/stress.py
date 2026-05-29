from __future__ import annotations

from datetime import date

from pydantic import BaseModel


class StressEvent(BaseModel):
    title: str
    date: date
    type: str = "exam"
    weight: float = 1.0


class StressPoint(BaseModel):
    date: date
    score: float
    label: str


class StressForecastRequest(BaseModel):
    events: list[StressEvent] = []
    days: int = 14


class StressForecastResponse(BaseModel):
    data: list[StressPoint]
    summary: str
    check_ins: list[str] = []
    recommendations: list[str] = []
