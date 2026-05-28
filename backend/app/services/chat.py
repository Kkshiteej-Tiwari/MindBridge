from __future__ import annotations

import os
import random
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


def _fallback_reply(message: str, risk_level: str) -> str:
    if risk_level == "crisis":
        return (
            "I am really sorry you are feeling this way. You deserve support. "
            "If you are in immediate danger or thinking about self harm, "
            "please contact local emergency services or a trusted person now."
        )
    response = random.choice(FALLBACK_RESPONSES)
    return response


def generate_reply(message: str, session_id: str | None = None, history: list[object] | None = None) -> dict[str, object]:
    if not session_id:
        session_id = create_session()["id"]

    risk_level = classify_risk(message)
    tags = _infer_tags(message)
    resources = get_crisis_resources("India") if risk_level == "crisis" else []

    client = _openai_client()
    reply_text = ""
    if client and risk_level != "crisis":
        model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        if history is not None:
            base_history = [
                item.model_dump(by_alias=True) if hasattr(item, "model_dump") else item
                for item in history
            ]
        else:
            base_history = get_session_messages(session_id)
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
            reply_text = _fallback_reply(message, risk_level)
    else:
        reply_text = _fallback_reply(message, risk_level)

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
