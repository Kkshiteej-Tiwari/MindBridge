from __future__ import annotations

import re
from datetime import datetime
from datetime import date, timedelta
from urllib.parse import urlparse

import httpx

from ..models.stress import StressCheckIn, StressEvent, StressPeak


EVENT_WEIGHTS = {
    "exam": 1.0,
    "assignment": 0.82,
    "presentation": 0.74,
    "project": 0.68,
    "deadline": 0.88,
    "quiz": 0.7,
}

EVENT_LABELS = {
    "exam": "Exam",
    "assignment": "Assignment",
    "presentation": "Presentation",
    "project": "Project",
    "deadline": "Deadline",
    "quiz": "Quiz",
}

CALENDAR_KEYWORDS = {
    "exam": ("exam", "midterm", "final", "test", "quiz"),
    "assignment": ("assignment", "homework", "essay", "paper", "submission"),
    "presentation": ("presentation", "seminar", "demo", "viva"),
    "project": ("project", "capstone", "hackathon", "lab"),
    "deadline": ("deadline", "due", "submit", "submission"),
    "quiz": ("quiz",),
}


def _event_type_for_title(title: str) -> str:
    lower = title.lower()
    for event_type, keywords in CALENDAR_KEYWORDS.items():
        if any(keyword in lower for keyword in keywords):
            return event_type
    return "exam"


def _unescape_ics_value(value: str) -> str:
    return (
        value.replace("\\n", "\n")
        .replace("\\N", "\n")
        .replace("\\,", ",")
        .replace("\\;", ";")
        .replace("\\\\", "\\")
    )


def _parse_ics_datetime(raw: str) -> date | None:
    value = raw.strip()
    if not value:
        return None

    if re.fullmatch(r"\d{8}", value):
        return date.fromisoformat(f"{value[0:4]}-{value[4:6]}-{value[6:8]}")

    if value.endswith("Z"):
        try:
            return datetime.strptime(value, "%Y%m%dT%H%M%SZ").date()
        except ValueError:
            return None

    if "T" in value:
        try:
            return datetime.strptime(value[:15], "%Y%m%dT%H%M%S").date()
        except ValueError:
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
            except ValueError:
                return None

    return None


def _unfold_ics_lines(ics_text: str) -> list[str]:
    lines: list[str] = []
    for raw_line in ics_text.replace("\r\n", "\n").replace("\r", "\n").split("\n"):
        if raw_line.startswith(" ") and lines:
            lines[-1] += raw_line[1:]
        else:
            lines.append(raw_line)
    return lines


def _extract_vevent_blocks(ics_text: str) -> list[list[str]]:
    blocks: list[list[str]] = []
    current: list[str] = []
    inside_event = False

    for line in _unfold_ics_lines(ics_text):
        marker = line.strip().upper()
        if marker == "BEGIN:VEVENT":
            inside_event = True
            current = []
            continue
        if marker == "END:VEVENT" and inside_event:
            blocks.append(current)
            current = []
            inside_event = False
            continue
        if inside_event:
            current.append(line)

    return blocks


def _parse_event_block(block: list[str]) -> StressEvent | None:
    properties: dict[str, list[str]] = {}
    for line in block:
        if ":" not in line:
            continue
        key_part, value = line.split(":", 1)
        key = key_part.split(";", 1)[0].strip().upper()
        properties.setdefault(key, []).append(_unescape_ics_value(value))

    raw_title = properties.get("SUMMARY", [""])[0].strip()
    raw_start = properties.get("DTSTART", [""])[0].strip()
    if not raw_title or not raw_start:
        return None

    parsed_date = _parse_ics_datetime(raw_start)
    if parsed_date is None:
        return None

    return StressEvent(
        title=raw_title,
        date=parsed_date,
        type=_event_type_for_title(raw_title),
        weight=1.0,
    )


def parse_calendar_feed(ics_text: str) -> list[StressEvent]:
    events: list[StressEvent] = []
    for block in _extract_vevent_blocks(ics_text):
        event = _parse_event_block(block)
        if event:
            events.append(event)

    events.sort(key=lambda item: item.date)
    return events


async def fetch_calendar_events(calendar_url: str) -> list[StressEvent]:
    parsed = urlparse(calendar_url)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("calendar_url must start with http:// or https://")

    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        response = await client.get(calendar_url)
        response.raise_for_status()

    events = parse_calendar_feed(response.text)
    if not events:
        raise ValueError(
            "No events were found in that calendar feed. Paste a public .ics export URL, not the Google Calendar app page."
        )

    return events


def _event_score(days_until: int, weight: float, horizon: int) -> float:
    if days_until < 0 or days_until > horizon:
        return 0.0
    if days_until <= 1:
        boost = 1.0
    elif days_until <= 3:
        boost = 0.82
    elif days_until <= 7:
        boost = 0.58
    else:
        boost = 0.28
    ramp = 1 - (days_until / horizon)
    return weight * (0.18 + 0.82 * ramp) * boost


def _label_for_score(score: float) -> str:
    if score >= 0.8:
        return "Peak"
    if score >= 0.6:
        return "High"
    if score >= 0.4:
        return "Elevated"
    if score >= 0.22:
        return "Watch"
    return "Calm"


def _checkin_for_day(day: date, score: float, label: str, top_event: StressEvent | None) -> StressCheckIn:
    if score >= 0.8:
        title = "High-stress day ahead"
        message = "This looks like a peak day. Clear space, reduce extra commitments, and protect your energy."
        action = "Block a 15-minute reset and finish one priority early."
        priority = "high"
    elif score >= 0.6:
        title = "Proactive check-in"
        message = "Stress is rising soon. A small prep session today can make tomorrow feel much lighter."
        action = "Review the next task, then take a short walk or breathing break."
        priority = "medium"
    elif score >= 0.4:
        title = "Early warning"
        message = "You have a busy stretch coming up. A quick plan now can prevent a spike later."
        action = "Break work into one-hour chunks and choose one support habit."
        priority = "medium"
    else:
        title = "Low-stress window"
        message = "Use this calmer window to rest, recover, or get ahead on small tasks."
        action = "Do something restorative and avoid loading extra work."
        priority = "low"

    if top_event:
        message = f"{message} Main driver: {top_event.title}."

    return StressCheckIn(date=day, title=title, message=message, action=action, priority=priority)


def build_forecast(
    events: list[StressEvent],
    days: int = 14,
) -> tuple[list[dict[str, object]], str, list[dict[str, object]], list[dict[str, object]]]:
    horizon = max(3, min(days, 30))
    start = date.today()
    scores: list[dict[str, object]] = []
    peaks: list[dict[str, object]] = []
    check_ins: list[StressCheckIn] = []

    for offset in range(horizon):
        day = start + timedelta(days=offset)
        total = 0.08
        strongest_event: StressEvent | None = None
        strongest_value = 0.0
        for event in events:
            days_until = (event.date - day).days
            event_weight = event.weight * EVENT_WEIGHTS.get(event.type, 0.65)
            score = _event_score(days_until, event_weight, horizon)
            if score > strongest_value:
                strongest_value = score
                strongest_event = event
            total += score
        total = min(total, 1.0)
        label = _label_for_score(total)
        score_value = round(total, 2)
        scores.append({"date": day, "score": score_value, "label": label})

        if score_value >= 0.6:
            peaks.append({"date": day, "score": score_value, "label": label})

        if offset in (0, 2, 5) or score_value >= 0.6:
            check_ins.append(_checkin_for_day(day, score_value, label, strongest_event))

    if peaks:
        peak = max(peaks, key=lambda item: item["score"])
        summary = f"Highest stress is expected around {peak['date'].strftime('%b %d')} ({peak['label']})."
    else:
        summary = f"Stress forecast updated for the next {horizon} days."
    return scores, summary, peaks, [check_in.model_dump() for check_in in check_ins]


def default_events() -> list[StressEvent]:
    today = date.today()
    return [
        StressEvent(title="Midterm exam", date=today + timedelta(days=5), type="exam", weight=1.0),
        StressEvent(title="Group presentation", date=today + timedelta(days=10), type="presentation", weight=0.7),
        StressEvent(title="Assignment deadline", date=today + timedelta(days=13), type="assignment", weight=0.68),
    ]
