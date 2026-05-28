from __future__ import annotations

from pydantic import BaseModel, Field


class Challenge(BaseModel):
    id: str
    title: str
    description: str
    xp: int
    category: str
    completed: bool


class ChallengeProgress(BaseModel):
    streak: int
    xp: int
    level: int
    badges: list[str]
    last_completed_date: str | None = Field(default=None, alias="lastCompletedDate")

    model_config = {
        "populate_by_name": True,
    }


class ChallengesResponse(BaseModel):
    data: list[Challenge]
    progress: ChallengeProgress


class ChallengeCompleteRequest(BaseModel):
    challenge_id: str = Field(alias="challengeId")

    model_config = {
        "populate_by_name": True,
    }


class ChallengeCompleteResponse(BaseModel):
    data: list[Challenge]
    progress: ChallengeProgress
