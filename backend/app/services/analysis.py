from __future__ import annotations

import re
from dataclasses import dataclass


CRISIS_WORDS = {
    "suicide",
    "kill myself",
    "hurt myself",
    "self harm",
    "self-harm",
    "end it all",
}

NEGATIVE_WORDS = {
    "bad",
    "sad",
    "angry",
    "tired",
    "worried",
    "stressed",
    "stress",
    "anxious",
    "anxious",
    "anxiety",
    "depressed",
    "depression",
    "overwhelmed",
    "lonely",
    "hopeless",
    "panic",
    "burnout",
    "burned out",
    "terrible",
    "awful",
    "miserable",
    "horrible",
    "drained",
    "exhausted",
}

POSITIVE_WORDS = {
    "happy",
    "calm",
    "grateful",
    "relieved",
    "hopeful",
    "proud",
    "excited",
    "confident",
    "safe",
}


def _count_matches(content: str, phrases: set[str]) -> int:
    count = 0
    for phrase in phrases:
        pattern = rf"(?<!\w){re.escape(phrase)}(?!\w)"
        count += len(re.findall(pattern, content, flags=re.IGNORECASE))
    return count

MOOD_COLORS = {
    "crisis": "#FF6B6B",
    "distressed": "#F97316",
    "neutral": "#F7B731",
    "positive": "#00D4AA",
}


@dataclass(frozen=True)
class AnalysisResult:
    mood: str
    subject: str
    summary: str
    color: str
    sentiment_score: int
    negative: bool

    def to_dict(self) -> dict[str, object]:
        return {
            "mood": self.mood,
            "subject": self.subject,
            "summary": self.summary,
            "color": self.color,
            "sentimentScore": self.sentiment_score,
            "negative": self.negative,
        }


def _extract_subject(content: str) -> str:
    match = re.search(r"\b(?:about|regarding|on)\s+([^.\n,;:]+)", content, flags=re.IGNORECASE)
    if match:
        return match.group(1).strip().capitalize()

    words = re.findall(r"[A-Za-z']+", content)
    if not words:
        return "Daily Reflection"
    return " ".join(words[:3]).capitalize()


def _build_summary(content: str) -> str:
    stripped = content.strip()
    if not stripped:
        return "This entry is ready for reflection."

    sentences = re.split(r"(?<=[.!?])\s+", stripped)
    summary = sentences[0].strip()
    if len(summary) > 140:
        summary = summary[:137].rstrip() + "..."
    return summary


def analyze_content(content: str) -> AnalysisResult:
    lower = content.lower()

    crisis_hits = _count_matches(lower, CRISIS_WORDS)
    positive_hits = _count_matches(lower, POSITIVE_WORDS)
    negative_hits = _count_matches(lower, NEGATIVE_WORDS)

    if crisis_hits:
        mood = "crisis"
        sentiment_score = -10
        color = MOOD_COLORS[mood]
        negative = True
    elif negative_hits > 0 and positive_hits == 0:
        mood = "distressed"
        sentiment_score = max(-8, -3 - min(negative_hits, 5))
        color = MOOD_COLORS[mood]
        negative = True
    elif positive_hits > negative_hits:
        mood = "positive"
        sentiment_score = min(10, 3 + min(positive_hits, 5))
        color = MOOD_COLORS[mood]
        negative = False
    else:
        mood = "neutral"
        sentiment_score = 0
        color = MOOD_COLORS[mood]
        negative = False

    subject = _extract_subject(content)
    summary = _build_summary(content)

    return AnalysisResult(
        mood=mood,
        subject=subject,
        summary=summary,
        color=color,
        sentiment_score=sentiment_score,
        negative=negative,
    )
