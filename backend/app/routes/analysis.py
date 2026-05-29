from __future__ import annotations

from fastapi import APIRouter

from ..models.analysis import AnalysisRequest, AnalysisResponse
from ..services.analysis import analyze_text

router = APIRouter(prefix="/analyze", tags=["analysis"])


@router.post("", response_model=AnalysisResponse)
def analyze(payload: AnalysisRequest) -> AnalysisResponse:
    result = analyze_text(payload.content)
    return AnalysisResponse(data=result.to_dict())
