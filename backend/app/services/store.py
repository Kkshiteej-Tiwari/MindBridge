from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from uuid import uuid4

from .analysis import analyze_text

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_FILE = BASE_DIR / "data" / "journal_store.json"
STORE_LOCK = Lock()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _default_state() -> dict[str, list[dict[str, object]]]:
    return {"entries": []}


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


def _normalize_entry(entry: dict[str, object]) -> dict[str, object]:
    return {
        "id": entry["id"],
        "content": entry["content"],
        "createdAt": entry["createdAt"],
        "updatedAt": entry["updatedAt"],
        "analysis": entry["analysis"],
    }


def list_entries() -> list[dict[str, object]]:
    with STORE_LOCK:
        state = _read_state()
        entries = [_normalize_entry(entry) for entry in state["entries"]]
        return sorted(entries, key=lambda item: item["updatedAt"], reverse=True)


def get_entry(entry_id: str) -> dict[str, object] | None:
    with STORE_LOCK:
        state = _read_state()
        for entry in state["entries"]:
            if entry["id"] == entry_id:
                return _normalize_entry(entry)
    return None


def create_entry(content: str = "") -> dict[str, object]:
    with STORE_LOCK:
        state = _read_state()
        now = _now()
        analysis = analyze_text(content)
        entry = {
            "id": uuid4().hex,
            "content": content,
            "createdAt": now,
            "updatedAt": now,
            "analysis": analysis.to_dict(),
        }
        state["entries"].append(entry)
        _write_state(state)
        return _normalize_entry(entry)


def update_entry(entry_id: str, content: str) -> dict[str, object]:
    with STORE_LOCK:
        state = _read_state()
        for index, entry in enumerate(state["entries"]):
            if entry["id"] == entry_id:
                now = _now()
                analysis = analyze_text(content)
                updated_entry = {
                    **entry,
                    "content": content,
                    "updatedAt": now,
                    "analysis": analysis.to_dict(),
                }
                state["entries"][index] = updated_entry
                _write_state(state)
                return _normalize_entry(updated_entry)

    raise KeyError(entry_id)


def get_history() -> list[dict[str, object]]:
    entries = list_entries()
    return [
        {
            "id": entry["id"],
            "createdAt": entry["createdAt"],
            "sentimentScore": entry["analysis"]["sentimentScore"],
            "mood": entry["analysis"]["mood"],
            "color": entry["analysis"]["color"],
        }
        for entry in reversed(entries)
    ]
