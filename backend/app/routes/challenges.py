from __future__ import annotations

from fastapi import APIRouter

from ..models.challenges import ChallengeCompleteRequest, ChallengeCompleteResponse, ChallengesResponse
from ..services.challenges_store import complete_challenge, get_daily_state

router = APIRouter(prefix="/challenges", tags=["challenges"])


@router.get("/daily", response_model=ChallengesResponse)
def read_daily_challenges() -> ChallengesResponse:
    challenges, progress = get_daily_state()
    return ChallengesResponse(data=challenges, progress=progress)


@router.post("/complete", response_model=ChallengeCompleteResponse)
def complete_daily_challenge(payload: ChallengeCompleteRequest) -> ChallengeCompleteResponse:
    challenges, progress = complete_challenge(payload.challenge_id)
    return ChallengeCompleteResponse(data=challenges, progress=progress)
