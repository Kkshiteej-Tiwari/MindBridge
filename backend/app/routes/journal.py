from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from ..models.journal import (
    HistoryPoint,
    JournalCreateRequest,
    JournalEntry,
    JournalListResponse,
    JournalResponse,
    JournalUpdateRequest,
)
from ..services.store import create_entry, get_history, get_entry, list_entries, update_entry

router = APIRouter(prefix="/journal", tags=["journal"])


@router.get("", response_model=JournalListResponse)
def read_entries() -> JournalListResponse:
    return JournalListResponse(data=list_entries())


@router.post("", response_model=JournalResponse, status_code=status.HTTP_201_CREATED)
def create_journal_entry(payload: JournalCreateRequest | None = None) -> JournalResponse:
    content = payload.content if payload else "Write about your day!"
    entry = create_entry(content=content)
    return JournalResponse(data=entry)


@router.get("/history", response_model=list[HistoryPoint])
def read_history() -> list[HistoryPoint]:
    return get_history()


@router.get("/{entry_id}", response_model=JournalResponse)
def read_journal_entry(entry_id: str) -> JournalResponse:
    entry = get_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return JournalResponse(data=entry)


@router.patch("/{entry_id}", response_model=JournalResponse)
def patch_journal_entry(entry_id: str, payload: JournalUpdateRequest) -> JournalResponse:
    try:
        entry = update_entry(entry_id, payload.content)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Journal entry not found") from exc
    return JournalResponse(data=entry)
