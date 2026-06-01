from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, status

from ..models.journal import (
    HistoryPoint,
    JournalCreateRequest,
    JournalEntry,
    JournalListResponse,
    JournalResponse,
    JournalUpdateRequest,
)
from ..services.store import create_entry, get_history, get_entry, list_entries, update_entry, delete_entry

router = APIRouter(prefix="/journal", tags=["journal"])

_ANONYMOUS = "anonymous"


def _uid(x_user_id: str | None) -> str:
    """Return the user ID from the header, falling back to 'anonymous'."""
    return (x_user_id or "").strip() or _ANONYMOUS


@router.get("", response_model=JournalListResponse)
def read_entries(x_user_id: str | None = Header(default=None)) -> JournalListResponse:
    return JournalListResponse(data=list_entries(_uid(x_user_id)))


@router.post("", response_model=JournalResponse, status_code=status.HTTP_201_CREATED)
def create_journal_entry(
    payload: JournalCreateRequest | None = None,
    x_user_id: str | None = Header(default=None),
) -> JournalResponse:
    content = payload.content if payload else ""
    entry = create_entry(content=content, user_id=_uid(x_user_id))
    return JournalResponse(data=entry)


@router.get("/history", response_model=list[HistoryPoint])
def read_history(x_user_id: str | None = Header(default=None)) -> list[HistoryPoint]:
    return get_history(_uid(x_user_id))


@router.get("/{entry_id}", response_model=JournalResponse)
def read_journal_entry(
    entry_id: str,
    x_user_id: str | None = Header(default=None),
) -> JournalResponse:
    entry = get_entry(entry_id, _uid(x_user_id))
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return JournalResponse(data=entry)


@router.patch("/{entry_id}", response_model=JournalResponse)
def patch_journal_entry(
    entry_id: str,
    payload: JournalUpdateRequest,
    x_user_id: str | None = Header(default=None),
) -> JournalResponse:
    try:
        entry = update_entry(entry_id, payload.content, _uid(x_user_id))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Journal entry not found") from exc
    return JournalResponse(data=entry)


@router.delete("/{entry_id}", status_code=status.HTTP_200_OK)
def delete_journal_entry(
    entry_id: str,
    x_user_id: str | None = Header(default=None),
) -> dict:
    try:
        delete_entry(entry_id, _uid(x_user_id))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Journal entry not found") from exc
    return {"ok": True}

