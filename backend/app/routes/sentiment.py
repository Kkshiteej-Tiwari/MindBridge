from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from ..services.analysis import analyze_text, analyze_content

router = APIRouter(prefix="/api/v1/sentiment", tags=["sentiment"])


class SentimentRequest(BaseModel):
    text: str


class SentimentResponse(BaseModel):
    sentiment: str
    confidence: float
    mood_score: int
    intensity: str
    gradient: dict


INTENSITY_MAP = {
    "crisis": "critical",
    "distressed": "high",
    "neutral": "low",
    "positive": "low",
}

GRADIENT_MAP = {
    "crisis": {"from": "#FF6B6B", "to": "#FF4444"},
    "distressed": {"from": "#F97316", "to": "#FF7A6A"},
    "neutral": {"from": "#F7B731", "to": "#F9B26B"},
    "positive": {"from": "#2EC4B6", "to": "#00D4AA"},
}


@router.post("/analyze", response_model=SentimentResponse)
async def analyze_sentiment_endpoint(payload: SentimentRequest) -> SentimentResponse:
    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="text is required")

    try:
        result = analyze_text(text)
        mood = result.mood
        score = result.sentiment_score
        # Normalize score from [-10, 10] to [0, 100]
        mood_score = max(0, min(100, int((score + 10) * 5)))
        intensity = INTENSITY_MAP.get(mood, "low")
        gradient = GRADIENT_MAP.get(mood, {"from": result.color, "to": result.color})

        return SentimentResponse(
            sentiment=mood,
            confidence=0.85 if mood != "neutral" else 0.6,
            mood_score=mood_score,
            intensity=intensity,
            gradient=gradient,
        )
    except Exception:
        # Fallback to heuristic analysis
        fallback = analyze_content(text)
        sentiment = fallback.mood
        mood_score = max(0, min(100, int((fallback.sentiment_score + 10) * 5)))
        gradient = GRADIENT_MAP.get(sentiment, {"from": fallback.color, "to": fallback.color})
        return SentimentResponse(
            sentiment=sentiment,
            confidence=0.5,
            mood_score=mood_score,
            intensity=INTENSITY_MAP.get(sentiment, "low"),
            gradient=gradient,
        )
