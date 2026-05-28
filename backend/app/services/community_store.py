from __future__ import annotations

import json
import random
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from uuid import uuid4

from .analysis import classify_risk

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_FILE = BASE_DIR / "data" / "community_store.json"
STORE_LOCK = Lock()
ALLOWED_REACTIONS = {"heart", "hug", "strength"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _default_state() -> dict[str, list[dict[str, object]]]:
    return {"posts": []}


def _ensure_data_file() -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists():
        DATA_FILE.write_text(json.dumps(_default_state(), indent=2), encoding="utf-8")


def _read_state() -> dict[str, list[dict[str, object]]]:
    _ensure_data_file()
    raw = DATA_FILE.read_text(encoding="utf-8")
    if not raw.strip():
        return _default_state()
    return json.loads(raw)


def _write_state(state: dict[str, list[dict[str, object]]]) -> None:
    DATA_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


def _support_count(reactions: dict[str, int]) -> int:
    return sum(reactions.values())


def _normalize_post(post: dict[str, object]) -> dict[str, object]:
    reactions = post.get("reactions", {})
    return {
        "id": post["id"],
        "content": post["content"],
        "topic": post["topic"],
        "mood": post["mood"],
        "createdAt": post["createdAt"],
        "reactions": reactions,
        "supportCount": _support_count(reactions),
        "flagged": post.get("flagged", False),
        "visibility": post.get("visibility", "public"),
        "anonName": post.get("anonName", "Student"),
    }


def list_posts(topic: str | None = None) -> list[dict[str, object]]:
    with STORE_LOCK:
        state = _read_state()
        posts = [post for post in state["posts"] if post.get("visibility") == "public"]
        if topic:
            posts = [post for post in posts if post.get("topic", "").lower() == topic.lower()]
        normalized = [_normalize_post(post) for post in posts]
        return sorted(normalized, key=lambda item: item["createdAt"], reverse=True)


def create_post(content: str, topic: str, mood: str) -> dict[str, object]:
    with STORE_LOCK:
        state = _read_state()
        now = _now()
        risk_level = classify_risk(content)
        flagged = risk_level == "crisis"
        visibility = "pending" if flagged else "public"
        post = {
            "id": uuid4().hex,
            "content": content,
            "topic": topic,
            "mood": mood,
            "createdAt": now,
            "reactions": {"heart": 0, "hug": 0, "strength": 0},
            "flagged": flagged,
            "visibility": visibility,
            "anonName": "Student {}".format(random.randint(100, 999)),
        }
        state["posts"].append(post)
        _write_state(state)
        return _normalize_post(post)


def add_reaction(post_id: str, reaction: str) -> dict[str, object]:
    if reaction not in ALLOWED_REACTIONS:
        raise ValueError("Unsupported reaction")

    with STORE_LOCK:
        state = _read_state()
        for index, post in enumerate(state["posts"]):
            if post["id"] == post_id:
                reactions = post.setdefault("reactions", {})
                reactions[reaction] = reactions.get(reaction, 0) + 1
                state["posts"][index] = post
                _write_state(state)
                return _normalize_post(post)

    raise KeyError(post_id)
