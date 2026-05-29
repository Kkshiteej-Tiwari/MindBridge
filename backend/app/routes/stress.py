from __future__ import annotations

from fastapi import APIRouter

from ..models.stress import StressForecastRequest, StressForecastResponse
from ..services.stress import build_forecast, default_events

router = APIRouter(prefix="/stress", tags=["stress"])


@router.post("/forecast", response_model=StressForecastResponse)
def forecast(payload: StressForecastRequest) -> StressForecastResponse:
    events = payload.events or default_events()
    data, summary, check_ins, recommendations = build_forecast(events, payload.days)
    return StressForecastResponse(
        data=data,
        summary=summary,
        check_ins=check_ins,
        recommendations=recommendations,
    )
