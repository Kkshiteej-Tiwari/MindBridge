from __future__ import annotations

import asyncio
import functools
import os
import re
import time
from dataclasses import dataclass
from typing import Any

import httpx

try:
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    import torch
except Exception:  # pragma: no cover - optional dependency
    pipeline = None
    torch = None

# --- Preserve heuristic lists for fallback ---
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


# --- HuggingFace-backed analyzer ---
class HFAnalyzer:
    def __init__(self) -> None:
        self.model_name = os.getenv("HF_MODEL", "distilbert-base-uncased-finetuned-sst-2-english")
        self.use_inference_api = os.getenv("HF_USE_INFERENCE_API", "false").lower() in ("1", "true", "yes")
        self.api_token = os.getenv("HF_API_TOKEN")
        self.timeout = int(os.getenv("HF_TIMEOUT_MS", "4000")) / 1000.0
        self._pipeline = None
        self._load_lock = asyncio.Lock()
        self._concurrency_limit = int(os.getenv("HF_CONCURRENCY_LIMIT", "4"))
        self._semaphore = asyncio.Semaphore(self._concurrency_limit)

    async def _ensure_loaded(self) -> None:
        if self._pipeline is not None or self.use_inference_api:
            return
        async with self._load_lock:
            if self._pipeline is not None:
                return
            if pipeline is None:
                # transformers not available
                return
            # load model lazily in a thread
            def _load():
                device = 0 if torch and torch.cuda.is_available() else -1
                return pipeline("sentiment-analysis", model=self.model_name, device=device)

            loop = asyncio.get_event_loop()
            self._pipeline = await loop.run_in_executor(None, _load)

    def _map_output(self, label: str, score: float) -> dict[str, Any]:
        # HuggingFace labels vary by model, normalize
        lab = label.lower()
        if lab.startswith("pos") or "positive" in lab:
            sentiment = "positive"
        elif lab.startswith("neg") or "negative" in lab:
            sentiment = "negative"
        else:
            sentiment = "neutral"

        # map to mood_score (0-100)
        base = {"positive": 80, "neutral": 50, "negative": 20}[sentiment]
        mood_score = max(0, min(100, int(base * score / 1.0)))

        intensity = "low"
        if score >= 0.85:
            intensity = "high"
        elif score >= 0.6:
            intensity = "medium"

        gradient = {
            "positive": {"from": "#FFB784", "to": "#FF6B9B"},
            "neutral": {"from": "#A8DADC", "to": "#E6F5F2"},
            "negative": {"from": "#8A7FC1", "to": "#4B2C7A"},
        }[sentiment]

        return {
            "sentiment": sentiment,
            "confidence": float(score),
            "mood_score": int(mood_score),
            "intensity": intensity,
            "gradient": gradient,
        }

    async def analyze_async(self, text: str) -> dict[str, Any]:
        await self._ensure_loaded()

        # concurrency limit
        async with self._semaphore:
            try:
                if self.use_inference_api and self.api_token:
                    url = f"https://api-inference.huggingface.co/models/{self.model_name}"
                    headers = {"Authorization": f"Bearer {self.api_token}"}
                    async with httpx.AsyncClient(timeout=self.timeout) as client:
                        resp = await client.post(url, headers=headers, json={"inputs": text})
                        resp.raise_for_status()
                        data = resp.json()
                        # HF Inference API returns list of {label, score}
                        if isinstance(data, list) and data:
                            label = data[0].get("label", "neutral")
                            score = float(data[0].get("score", 0.0))
                        else:
                            label = "neutral"
                            score = 0.5
                        return {**self._map_output(label, score), "raw": data}
                else:
                    if self._pipeline is None:
                        # transformers not available -> fallback
                        raise RuntimeError("transformers pipeline not available")

                    # run pipeline in thread to avoid blocking event loop
                    loop = asyncio.get_event_loop()
                    fut = loop.run_in_executor(None, functools.partial(self._pipeline, text, truncation=True))
                    try:
                        res = await asyncio.wait_for(fut, timeout=self.timeout)
                    except asyncio.TimeoutError:
                        raise
                    if isinstance(res, list) and res:
                        label = res[0].get("label", "neutral")
                        score = float(res[0].get("score", 0.0))
                    else:
                        label = "neutral"
                        score = 0.5
                    return {**self._map_output(label, score), "raw": res}
            except Exception as exc:  # pragma: no cover - fallback path
                # bubble up for caller to use fallback heuristic
                raise


# simple module-level singleton
_HF_ANALYZER: HFAnalyzer | None = None


def get_hf_analyzer() -> HFAnalyzer:
    global _HF_ANALYZER
    if _HF_ANALYZER is None:
        _HF_ANALYZER = HFAnalyzer()
    return _HF_ANALYZER


def heuristic_analyze(content: str) -> AnalysisResult:
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


def analyze_content(content: str) -> AnalysisResult:
    """
    Backwards-compatible synchronous analyzer used by storage paths.
    Attempts a quick HF analysis with a short timeout; falls back to heuristic on any error.
    """
    try:
        analyzer = get_hf_analyzer()
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(asyncio.wait_for(analyzer.analyze_async(content), timeout=2.0))
        finally:
            try:
                loop.run_until_complete(loop.shutdown_asyncgens())
            except Exception:
                pass
            asyncio.set_event_loop(None)

        sentiment = result.get("sentiment", "neutral")
        confidence = result.get("confidence", 0.5)
        mood_score = result.get("mood_score", 50)

        # Map to old AnalysisResult fields
        if sentiment == "positive":
            mood = "positive"
            sentiment_score_val = min(10, int((mood_score / 100.0) * 10))
            negative = False
        elif sentiment == "negative":
            mood = "distressed"
            sentiment_score_val = max(-10, -int((mood_score / 100.0) * 10))
            negative = True
        else:
            mood = "neutral"
            sentiment_score_val = 0
            negative = False

        subject = _extract_subject(content)
        summary = _build_summary(content)
        color = MOOD_COLORS.get(mood, MOOD_COLORS["neutral"])

        return AnalysisResult(
            mood=mood,
            subject=subject,
            summary=summary,
            color=color,
            sentiment_score=sentiment_score_val,
            negative=negative,
        )
    except Exception:
        # fallback to heuristic
        return heuristic_analyze(content)


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
