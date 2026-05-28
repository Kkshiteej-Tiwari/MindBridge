from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status

from ..models.stress import CalendarImportRequest, CalendarImportResponse, StressForecastRequest, StressForecastResponse
from ..services.stress import build_forecast, default_events, fetch_calendar_events

router = APIRouter(prefix="/stress", tags=["stress"])


@router.post("/forecast", response_model=StressForecastResponse)
def forecast(payload: StressForecastRequest) -> StressForecastResponse:
    events = payload.events or default_events()
    data, summary, peaks, check_ins = build_forecast(events, payload.days)
    return StressForecastResponse(data=data, summary=summary, peaks=peaks, check_ins=check_ins)


@router.post("/import-calendar", response_model=CalendarImportResponse)
async def import_calendar(payload: CalendarImportRequest) -> CalendarImportResponse:
    calendar_url = payload.calendar_url.strip()
    if not calendar_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="calendar_url is required")

    try:
        events = await fetch_calendar_events(calendar_url)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to fetch calendar feed") from exc

    return CalendarImportResponse(
        data=events,
        calendar_url=calendar_url,
        imported_at=datetime.now(timezone.utc).isoformat(),
    )
