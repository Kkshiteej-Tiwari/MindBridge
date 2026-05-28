from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from ..services.analysis import get_hf_analyzer, heuristic_analyze

router = APIRouter(prefix="/api/v1/sentiment", tags=["sentiment"])


class SentimentRequest(BaseModel):
    text: str


class SentimentResponse(BaseModel):
    sentiment: str
    confidence: float
    mood_score: int
    intensity: str
    gradient: dict


@router.post("/analyze", response_model=SentimentResponse)
async def analyze_text(payload: SentimentRequest) -> SentimentResponse:
    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="text is required")

    analyzer = get_hf_analyzer()
    try:
        result = await analyzer.analyze_async(text)
        return SentimentResponse(
            sentiment=result.get("sentiment", "neutral"),
            confidence=float(result.get("confidence", 0.0)),
            mood_score=int(result.get("mood_score", 50)),
            intensity=result.get("intensity", "low"),
            gradient=result.get("gradient", {}),
        )
    except Exception:
        # Fallback: use heuristic synchronous analyzer if HF fails
        fallback = heuristic_analyze(text)
        # create a best-effort mapping
        sentiment = fallback.mood if fallback.mood in ("positive", "neutral", "distressed") else "neutral"
        mood_score = max(0, min(100, (fallback.sentiment_score + 10) * 5))
        grad = {"from": fallback.color, "to": fallback.color}
        return SentimentResponse(
            sentiment=sentiment,
            confidence=0.5,
            mood_score=mood_score,
            intensity="low",
            gradient=grad,
        )
