from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from uuid import uuid4

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_FILE = BASE_DIR / "data" / "chat_store.json"
STORE_LOCK = Lock()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _default_state() -> dict[str, list[dict[str, object]]]:
    return {"sessions": []}


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


def create_session() -> dict[str, object]:
    with STORE_LOCK:
        state = _read_state()
        session = {"id": uuid4().hex, "createdAt": _now(), "messages": []}
        state["sessions"].append(session)
        _write_state(state)
        return session


def append_message(session_id: str, role: str, content: str, tags: list[str] | None = None) -> None:
    with STORE_LOCK:
        state = _read_state()
        for session in state["sessions"]:
            if session["id"] == session_id:
                session["messages"].append(
                    {"role": role, "content": content, "tags": tags or [], "createdAt": _now()}
                )
                _write_state(state)
                return

    raise KeyError(session_id)


def get_session_messages(session_id: str) -> list[dict[str, object]]:
    with STORE_LOCK:
        state = _read_state()
        for session in state["sessions"]:
            if session["id"] == session_id:
                return list(session.get("messages", []))
    return []
