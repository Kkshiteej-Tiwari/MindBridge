from __future__ import annotations

import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from threading import RLock

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_FILE = BASE_DIR / "data" / "challenges_store.json"
STORE_LOCK = RLock()

DEFAULT_CHALLENGES: list[dict[str, object]] = [
    {
        "id": "journal",
        "title": "Journal entry",
        "description": "Write a short reflection about today.",
        "xp": 20,
        "category": "reflection",
    },
    {
        "id": "breathing",
        "title": "Breathing reset",
        "description": "Complete a two minute breathing exercise.",
        "xp": 15,
        "category": "mindfulness",
    },
    {
        "id": "gratitude",
        "title": "Gratitude note",
        "description": "List three things you appreciate.",
        "xp": 15,
        "category": "positive",
    },
    {
        "id": "movement",
        "title": "Move your body",
        "description": "Take a five minute stretch or walk.",
        "xp": 10,
        "category": "energy",
    },
]

BADGE_MILESTONES = {
    3: "3-day spark",
    7: "7-day streak",
    14: "14-day momentum",
    30: "30-day legend",
}

_ANONYMOUS = "anonymous"


def _today() -> date:
    return datetime.now(timezone.utc).date()


def _default_user_state() -> dict[str, object]:
    return {
        "completed": {},
        "progress": {"streak": 0, "xp": 0, "level": 1, "badges": [], "lastCompletedDate": None},
    }


def _default_state() -> dict[str, object]:
    # Structure: { "users": { "<user_id>": { completed, progress } } }
    return {"users": {}}


def _ensure_data_file() -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists():
        DATA_FILE.write_text(json.dumps(_default_state(), indent=2), encoding="utf-8")


def _read_state() -> dict[str, object]:
    _ensure_data_file()
    raw = DATA_FILE.read_text(encoding="utf-8")
    if not raw.strip():
        return _default_state()
    data = json.loads(raw)
    # Migrate old flat format {"completed":…, "progress":…} → new per-user format
    if "users" not in data and ("completed" in data or "progress" in data):
        data = {"users": {_ANONYMOUS: data}}
        DATA_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")
    if "users" not in data:
        data["users"] = {}
    return data


def _write_state(state: dict[str, object]) -> None:
    DATA_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


def _user_state(state: dict, user_id: str) -> dict[str, object]:
    if user_id not in state["users"]:
        state["users"][user_id] = _default_user_state()
    return state["users"][user_id]


def get_daily_state(user_id: str = _ANONYMOUS) -> tuple[list[dict[str, object]], dict[str, object]]:
    with STORE_LOCK:
        state = _read_state()
        u = _user_state(state, user_id)
        today_key = _today().isoformat()
        completed_today = set(u.get("completed", {}).get(today_key, []))

        challenges = [
            {
                **challenge,
                "completed": challenge["id"] in completed_today,
            }
            for challenge in DEFAULT_CHALLENGES
        ]

        return challenges, u["progress"]


def _update_streak(progress: dict[str, object], today: date) -> None:
    last_completed_raw = progress.get("lastCompletedDate")
    if last_completed_raw:
        last_completed = date.fromisoformat(last_completed_raw)
    else:
        last_completed = None

    if last_completed == today:
        return

    if last_completed and last_completed == today - timedelta(days=1):
        progress["streak"] = int(progress.get("streak", 0)) + 1
    else:
        progress["streak"] = 1

    progress["lastCompletedDate"] = today.isoformat()


def _award_badges(progress: dict[str, object]) -> None:
    streak = int(progress.get("streak", 0))
    badges = list(progress.get("badges", []))
    for milestone, name in BADGE_MILESTONES.items():
        if streak >= milestone and name not in badges:
            badges.append(name)
    progress["badges"] = badges


def complete_challenge(challenge_id: str, user_id: str = _ANONYMOUS) -> tuple[list[dict[str, object]], dict[str, object]]:
    with STORE_LOCK:
        state = _read_state()
        u = _user_state(state, user_id)
        today = _today()
        today_key = today.isoformat()
        completed = set(u.get("completed", {}).get(today_key, []))

        if challenge_id not in completed:
            completed.add(challenge_id)
            u.setdefault("completed", {})[today_key] = sorted(completed)
            challenge = next((item for item in DEFAULT_CHALLENGES if item["id"] == challenge_id), None)
            if challenge:
                progress = u["progress"]
                progress["xp"] = int(progress.get("xp", 0)) + int(challenge["xp"])
                progress["level"] = 1 + int(progress["xp"]) // 100
                _update_streak(progress, today)
                _award_badges(progress)

        _write_state(state)
        return get_daily_state(user_id)
