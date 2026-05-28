from __future__ import annotations

from datetime import date, timedelta

from ..models.stress import StressEvent


def _event_score(days_until: int, weight: float, horizon: int) -> float:
    if days_until < 0 or days_until > horizon:
        return 0.0
    ramp = 1 - (days_until / horizon)
    return weight * (0.2 + 0.8 * ramp)


def build_forecast(events: list[StressEvent], days: int = 14) -> tuple[list[dict[str, object]], str]:
    horizon = max(3, min(days, 30))
    start = date.today()
    scores: list[dict[str, object]] = []

    for offset in range(horizon):
        day = start + timedelta(days=offset)
        total = 0.1
        for event in events:
            days_until = (event.date - day).days
            total += _event_score(days_until, event.weight, horizon)
        total = min(total, 1.0)
        if total >= 0.75:
            label = "Peak"
        elif total >= 0.45:
            label = "Elevated"
        elif total >= 0.25:
            label = "Watch"
        else:
            label = "Calm"
        scores.append({"date": day, "score": round(total, 2), "label": label})

    summary = "Stress forecast updated for the next {} days.".format(horizon)
    return scores, summary


def default_events() -> list[StressEvent]:
    today = date.today()
    return [
        StressEvent(title="Midterm exam", date=today + timedelta(days=5), type="exam", weight=1.0),
        StressEvent(title="Group presentation", date=today + timedelta(days=10), type="presentation", weight=0.7),
        StressEvent(title="Assignment deadline", date=today + timedelta(days=13), type="assignment", weight=0.5),
    ]
