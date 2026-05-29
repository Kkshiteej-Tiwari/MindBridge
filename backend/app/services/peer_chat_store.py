from __future__ import annotations

import json
import random
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from uuid import uuid4

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_FILE = BASE_DIR / "data" / "peer_chat_store.json"
STORE_LOCK = Lock()

MENTOR_OPENERS = [
    "Thanks for reaching out. I am here with you.",
    "I hear you. Want to talk through the next small step?",
    "You are not alone. Let us take this one piece at a time.",
]

MENTOR_RESPONSES = {
    "exam": "Exams can feel huge. Try picking one chapter and a 25 minute focus block.",
    "stress": "That sounds heavy. A short reset and a tiny next step can help.",
    "lonely": "That is tough. Would it help to message a friend or join a study room?",
    "sleep": "Sleep makes a big difference. Could you try a short wind-down tonight?",
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _default_state() -> dict[str, list[dict[str, object]]]:
    return {"threads": []}


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


def _normalize_thread(thread: dict[str, object]) -> dict[str, object]:
    return {
        "id": thread["id"],
        "topic": thread.get("topic", "General"),
        "status": thread.get("status", "open"),
        "lastUpdated": thread.get("lastUpdated"),
        "messages": thread.get("messages", []),
    }


def _build_preview(thread: dict[str, object]) -> str:
    messages = thread.get("messages", [])
    if not messages:
        return ""
    return messages[-1].get("content", "")[:80]


def list_threads() -> list[dict[str, object]]:
    with STORE_LOCK:
        state = _read_state()
        threads = state["threads"]
        summaries = []
        for thread in threads:
            summaries.append(
                {
                    "id": thread["id"],
                    "topic": thread.get("topic", "General"),
                    "status": thread.get("status", "open"),
                    "lastUpdated": thread.get("lastUpdated"),
                    "preview": _build_preview(thread),
                }
            )
        return sorted(summaries, key=lambda item: item.get("lastUpdated") or "", reverse=True)


def get_thread(thread_id: str) -> dict[str, object] | None:
    with STORE_LOCK:
        state = _read_state()
        for thread in state["threads"]:
            if thread["id"] == thread_id:
                return _normalize_thread(thread)
    return None


def _mentor_reply(message: str) -> str:
    lower = message.lower()
    for key, reply in MENTOR_RESPONSES.items():
        if key in lower:
            return reply
    return random.choice(MENTOR_OPENERS)


def _ensure_thread(state: dict[str, list[dict[str, object]]], topic: str) -> dict[str, object]:
    thread = {
        "id": uuid4().hex,
        "topic": topic,
        "status": "open",
        "lastUpdated": _now(),
        "messages": [],
    }
    state["threads"].append(thread)
    return thread


def send_message(message: str, thread_id: str | None = None, topic: str = "General") -> dict[str, object]:
    with STORE_LOCK:
        state = _read_state()
        thread = None
        if thread_id:
            thread = next((item for item in state["threads"] if item["id"] == thread_id), None)
        if not thread:
            thread = _ensure_thread(state, topic)

        user_message = {"id": uuid4().hex, "role": "user", "content": message, "createdAt": _now()}
        mentor_message = {"id": uuid4().hex, "role": "mentor", "content": _mentor_reply(message), "createdAt": _now()}
        thread["messages"].extend([user_message, mentor_message])
        thread["lastUpdated"] = _now()
        _write_state(state)
        return _normalize_thread(thread)
