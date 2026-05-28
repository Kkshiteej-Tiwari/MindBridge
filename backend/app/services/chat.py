from __future__ import annotations

import os
import random
import re
from datetime import datetime, timezone

from openai import OpenAI

from .analysis import classify_risk
from .chat_store import append_message, create_session, get_session_messages
from .resources import get_crisis_resources

SYSTEM_PROMPT = (
    "You are MindBridge, an empathetic student wellness coach. "
    "Use supportive, non-judgmental language. "
    "Offer one small next step and ask a gentle follow up question. "
    "If there are signs of crisis, encourage reaching out to a trusted person or helpline."
)

FALLBACK_RESPONSES = [
    "Thank you for sharing that. It sounds like this has been heavy. "
    "Would it help to name one small part you can handle today?",
    "I hear you. That can feel overwhelming. "
    "Would you like to try a short breathing reset together?",
    "That makes sense. You are not alone in this. "
    "What would feel like a gentle next step for you right now?",
]

AFFIRMATIVE_PHRASES = {
    "yes",
    "yeah",
    "yep",
    "sure",
    "okay",
    "ok",
    "please",
    "alright",
    "go ahead",
}

NEGATIVE_PHRASES = {
    "no",
    "nope",
    "nah",
    "not really",
    "dont",
    "do not",
}

BREATHING_TEXT = (
    "Let us do a short box breathing reset: inhale 4, hold 4, exhale 4, hold 4. "
    "Repeat four rounds and tell me how it feels."
)

FOCUS_TEXT = (
    "Let us make this lighter. Pick one small task and do a 25 minute focus block. "
    "What is the first tiny step you can start with?"
)

LONELY_TEXT = (
    "Feeling alone can be really hard. If there is no one nearby, we can still reach out online "
    "or to a helpline. Would you like a few options?"
)

SUGGESTED_ACTIONS = {
    "crisis": [
        "Reach out to a trusted person now",
        "Open crisis resources",
        "Move to a safer space",
    ],
    "distressed": [
        "Try a 2 minute breathing reset",
        "Write one worry and one next step",
        "Take a short break and hydrate",
    ],
    "neutral": [
        "Name one win from today",
        "Do a 5 minute stretch",
        "Plan one focus block",
    ],
    "positive": [
        "Capture what helped today",
        "Share a kind message",
        "Plan a small reward",
    ],
}

TAG_MAP = {
    "exam": "Study",
    "deadline": "Planning",
    "sleep": "Sleep",
    "anx": "Anxiety",
    "stress": "Stress",
    "panic": "Grounding",
    "lonely": "Connection",
    "breath": "Breathing",
    "breathe": "Breathing",
    "focus": "Focus",
}


def _infer_tags(text: str) -> list[str]:
    lower = text.lower()
    tags = []
    for key, label in TAG_MAP.items():
        if key in lower and label not in tags:
            tags.append(label)
    return tags[:3]


def _openai_client() -> OpenAI | None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    return OpenAI(api_key=api_key)


def _build_history(history: list[dict[str, object]]) -> list[dict[str, str]]:
    messages = []
    for item in history[-8:]:
        role = str(item.get("role", "user"))
        content = str(item.get("content", ""))
        if not content:
            continue
        messages.append({"role": role, "content": content})
    return messages


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def _matches_any(text: str, phrases: set[str]) -> bool:
    for phrase in phrases:
        if re.search(rf"(?<!\w){re.escape(phrase)}(?!\w)", text):
            return True
    return False


def _last_assistant_message(history: list[dict[str, object]]) -> str:
    for item in reversed(history):
        if str(item.get("role")) == "assistant":
            return str(item.get("content", ""))
    return ""


def _choose_response(candidates: list[str], last_assistant: str) -> str:
    if not candidates:
        return ""
    trimmed = [item for item in candidates if item.strip()]
    if not trimmed:
        return ""
    last_assistant = last_assistant.strip()
    if last_assistant:
        filtered = [item for item in trimmed if item.strip() != last_assistant]
        if filtered:
            return random.choice(filtered)
    return random.choice(trimmed)


def _fallback_reply(message: str, risk_level: str, history: list[dict[str, object]]) -> str:
    if risk_level == "crisis":
        return (
            "I am really sorry you are feeling this way. You deserve support. "
            "If you are in immediate danger or thinking about self harm, "
            "please contact local emergency services or a trusted person now."
        )

    normalized = _normalize_text(message)
    last_assistant = _last_assistant_message(history)

    if _matches_any(normalized, AFFIRMATIVE_PHRASES):
        if "breathing" in last_assistant or "reset" in last_assistant:
            return BREATHING_TEXT
        if "small part" in last_assistant or "next step" in last_assistant:
            return "Great. What is one small part you can handle today?"
        return "Got it. What would feel like a gentle next step right now?"

    if _matches_any(normalized, NEGATIVE_PHRASES):
        return "Thanks for letting me know. Would you like a grounding exercise or a planning step?"

    if "breath" in normalized or "breathing" in normalized:
        return BREATHING_TEXT

    if "focus" in normalized or "study" in normalized or "exam" in normalized:
        return FOCUS_TEXT

    if "lonely" in normalized or "alone" in normalized or "no one" in normalized or "nobody" in normalized:
        return LONELY_TEXT

    if "stress" in normalized or "overwhelm" in normalized or "anx" in normalized:
        return "That sounds heavy. Would it help to pick the most urgent task and break it into a 10 minute step?"

    if "sleep" in normalized or "tired" in normalized:
        return "Sleep can make everything feel bigger. Would a short wind down routine help tonight?"

    if "thanks" in normalized or "thank" in normalized:
        return "You are welcome. I am here with you. What else would help right now?"

    if "hi" == normalized or normalized.startswith("hello"):
        return "Hi. I am here with you. What is on your mind today?"

    return _choose_response(FALLBACK_RESPONSES, last_assistant)


def generate_reply(message: str, session_id: str | None = None, history: list[object] | None = None) -> dict[str, object]:
    if not session_id:
        session_id = create_session()["id"]

    risk_level = classify_risk(message)
    tags = _infer_tags(message)
    resources = get_crisis_resources("India") if risk_level == "crisis" else []

    if history is not None:
        base_history = [
            item.model_dump(by_alias=True) if hasattr(item, "model_dump") else item
            for item in history
        ]
    else:
        base_history = get_session_messages(session_id)

    client = _openai_client()
    reply_text = ""
    if client and risk_level != "crisis":
        model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        prompt_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        prompt_messages.extend(_build_history(base_history))
        prompt_messages.append({"role": "user", "content": message})
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=prompt_messages,
                temperature=0.4,
            )
            reply_text = response.choices[0].message.content or ""
        except Exception:
            reply_text = _fallback_reply(message, risk_level, base_history)
    else:
        reply_text = _fallback_reply(message, risk_level, base_history)

    suggested_actions = SUGGESTED_ACTIONS.get(risk_level, [])
    append_message(session_id, "user", message)
    append_message(session_id, "assistant", reply_text, tags=tags)

    return {
        "sessionId": session_id,
        "reply": reply_text,
        "riskLevel": risk_level,
        "tags": tags,
        "suggestedActions": suggested_actions,
        "resources": resources,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }
