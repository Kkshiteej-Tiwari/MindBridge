from __future__ import annotations

from pydantic import BaseModel, Field

from .journal import JournalAnalysis


class AnalysisRequest(BaseModel):
    content: str = Field(min_length=1)


class AnalysisResponse(BaseModel):
    data: JournalAnalysis
