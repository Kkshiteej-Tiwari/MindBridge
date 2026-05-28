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


class StressCheckIn(BaseModel):
    date: date
    title: str
    message: str
    action: str
    priority: str = "medium"


class StressPeak(BaseModel):
    date: date
    score: float
    label: str


class StressForecastRequest(BaseModel):
    events: list[StressEvent] = []
    days: int = 14


class StressForecastResponse(BaseModel):
    data: list[StressPoint]
    summary: str
    peaks: list[StressPeak] = []
    check_ins: list[StressCheckIn] = []


class CalendarImportRequest(BaseModel):
    calendar_url: str


class CalendarImportResponse(BaseModel):
    data: list[StressEvent]
    calendar_url: str
    imported_at: str
