from __future__ import annotations

import os
import re
from dataclasses import dataclass


CRISIS_WORDS = {
    "suicide",
    "suicidal",
    "kill myself",
    "kill me",
    "want to die",
    "end my life",
    "hurt myself",
    "self harm",
    "self-harm",
    "end it all",
    "cant go on",
    "can't go on",
    "no reason to live",
    "overdose",
    "die tonight",
    "die today",
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

PROMPTS_BY_MOOD = {
    "crisis": "You are not alone. If you can, write one small reason to stay safe right now.",
    "distressed": "What is one small thing that could make the next hour 1% easier?",
    "neutral": "Name one moment today that felt steady or okay.",
    "positive": "What helped you feel this way today, and how can you repeat it tomorrow?",
}

HF_DEFAULT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"
_HF_PIPELINE = None


@dataclass(frozen=True)
class AnalysisResult:
    mood: str
    subject: str
    summary: str
    color: str
    sentiment_score: int
    negative: bool
    risk_level: str
    reflection_prompt: str

    def to_dict(self) -> dict[str, object]:
        return {
            "mood": self.mood,
            "subject": self.subject,
            "summary": self.summary,
            "color": self.color,
            "sentimentScore": self.sentiment_score,
            "negative": self.negative,
            "riskLevel": self.risk_level,
            "reflectionPrompt": self.reflection_prompt,
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


def _build_reflection_prompt(mood: str, subject: str) -> str:
    prompt = PROMPTS_BY_MOOD.get(mood, PROMPTS_BY_MOOD["neutral"])
    if subject and subject != "Daily Reflection":
        return f"{prompt} (Topic: {subject})"
    return prompt


def _load_hf_pipeline():
    global _HF_PIPELINE
    if _HF_PIPELINE is not None:
        return _HF_PIPELINE

    model_name = os.getenv("HF_MODEL", HF_DEFAULT_MODEL)
    try:
        from transformers import pipeline
    except Exception:
        return None

    _HF_PIPELINE = pipeline("sentiment-analysis", model=model_name)
    return _HF_PIPELINE


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
    reflection_prompt = _build_reflection_prompt(mood, subject)
    risk_level = "crisis" if mood == "crisis" else "distressed" if negative else "neutral"

    return AnalysisResult(
        mood=mood,
        subject=subject,
        summary=summary,
        color=color,
        sentiment_score=sentiment_score,
        negative=negative,
        risk_level=risk_level,
        reflection_prompt=reflection_prompt,
    )


def analyze_text(content: str) -> AnalysisResult:
    if not content.strip():
        return analyze_content(content)

    if os.getenv("ENABLE_HF", "false").lower() not in {"1", "true", "yes"}:
        return analyze_content(content)

    pipeline_fn = _load_hf_pipeline()
    if not pipeline_fn:
        return analyze_content(content)

    try:
        result = pipeline_fn(content[:512])[0]
        label = str(result.get("label", "")).lower()
        score = float(result.get("score", 0))
    except Exception:
        return analyze_content(content)

    if classify_risk(content) == "crisis":
        return analyze_content(content)

    if "negative" in label:
        mood = "distressed"
        sentiment_score = -5 if score < 0.6 else -7
    elif "positive" in label:
        mood = "positive"
        sentiment_score = 5 if score < 0.6 else 7
    else:
        mood = "neutral"
        sentiment_score = 0

    subject = _extract_subject(content)
    summary = _build_summary(content)
    reflection_prompt = _build_reflection_prompt(mood, subject)
    risk_level = "distressed" if mood == "distressed" else "neutral"
    negative = mood == "distressed"

    return AnalysisResult(
        mood=mood,
        subject=subject,
        summary=summary,
        color=MOOD_COLORS[mood],
        sentiment_score=sentiment_score,
        negative=negative,
        risk_level=risk_level,
        reflection_prompt=reflection_prompt,
    )


def classify_risk(content: str) -> str:
    lower = content.lower()
    if _count_matches(lower, CRISIS_WORDS):
        return "crisis"
    if _count_matches(lower, NEGATIVE_WORDS):
        return "distressed"
    if _count_matches(lower, POSITIVE_WORDS):
        return "positive"
    return "neutral"


def detect_crisis(content: str) -> bool:
    return classify_risk(content) == "crisis"
