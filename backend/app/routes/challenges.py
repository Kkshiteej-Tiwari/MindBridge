from __future__ import annotations

from fastapi import APIRouter, Header

from ..models.challenges import ChallengeCompleteRequest, ChallengeCompleteResponse, ChallengesResponse
from ..services.challenges_store import complete_challenge, get_daily_state

router = APIRouter(prefix="/challenges", tags=["challenges"])

_ANONYMOUS = "anonymous"


def _uid(x_user_id: str | None) -> str:
    return (x_user_id or "").strip() or _ANONYMOUS


@router.get("/daily", response_model=ChallengesResponse)
def read_daily_challenges(x_user_id: str | None = Header(default=None)) -> ChallengesResponse:
    challenges, progress = get_daily_state(_uid(x_user_id))
    return ChallengesResponse(data=challenges, progress=progress)


@router.post("/complete", response_model=ChallengeCompleteResponse)
def complete_daily_challenge(
    payload: ChallengeCompleteRequest,
    x_user_id: str | None = Header(default=None),
) -> ChallengeCompleteResponse:
    challenges, progress = complete_challenge(payload.challenge_id, _uid(x_user_id))
    return ChallengeCompleteResponse(data=challenges, progress=progress)
