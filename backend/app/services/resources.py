from __future__ import annotations

from typing import Iterable


RESOURCE_ITEMS: list[dict[str, str | None]] = [
    {
        "id": "box-breathing",
        "title": "Box breathing reset",
        "description": "Inhale 4, hold 4, exhale 4, hold 4. Repeat four rounds.",
        "url": "https://www.healthline.com/health/box-breathing",
        "topic": "grounding",
        "urgency": "self-care",
        "location": None,
        "phone": None,
    },
    {
        "id": "study-plan",
        "title": "Calm study plan",
        "description": "Plan in 25 minute blocks and schedule a 10 minute reset after each block.",
        "url": "https://www.coursera.org/articles/pomodoro-technique",
        "topic": "academic",
        "urgency": "self-care",
        "location": None,
        "phone": None,
    },
    {
        "id": "sleep-routine",
        "title": "Sleep wind down",
        "description": "Dim lights, avoid screens, and do a five minute body scan before bed.",
        "url": "https://www.sleepfoundation.org/sleep-hygiene",
        "topic": "sleep",
        "urgency": "self-care",
        "location": None,
        "phone": None,
    },
    {
        "id": "grounding-54321",
        "title": "5-4-3-2-1 grounding",
        "description": "Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.",
        "url": "https://www.verywellmind.com/grounding-techniques-for-ptsd-2797300",
        "topic": "grounding",
        "urgency": "self-care",
        "location": None,
        "phone": None,
    },
    {
        "id": "talk-to-someone",
        "title": "How to ask for help",
        "description": "A short script for reaching out to friends or mentors when you feel overwhelmed.",
        "url": "https://www.mentalhealth.org.uk/explore-mental-health/a-z-topics/asking-help",
        "topic": "support",
        "urgency": "self-care",
        "location": None,
        "phone": None,
    },
    {
        "id": "conversation-starters",
        "title": "Conversation starter cards",
        "description": "Simple ways to start a supportive conversation with a friend or family member.",
        "url": "https://www.mind.org.uk/information-support/types-of-mental-health-problems/mental-health-problems-and-stigma/talking-about-mental-health/",
        "topic": "conversation",
        "urgency": "self-care",
        "location": None,
        "phone": None,
    },
    {
        "id": "mentor-message",
        "title": "Message a peer mentor",
        "description": "Draft a short check-in message for a trusted mentor or peer.",
        "url": None,
        "topic": "conversation",
        "urgency": "self-care",
        "location": None,
        "phone": None,
    },
]

CRISIS_RESOURCES: list[dict[str, str | None]] = [
    {
        "id": "global-emergency",
        "title": "Local emergency services",
        "description": "If you are in immediate danger, contact local emergency services now.",
        "url": None,
        "phone": "112 / 911",
        "topic": "crisis",
        "urgency": "urgent",
        "location": "Global",
    },
    {
        "id": "india-icall",
        "title": "iCall Helpline",
        "description": "Confidential counseling support by trained professionals.",
        "url": "https://icallhelpline.org",
        "phone": "+91-9152987821",
        "topic": "crisis",
        "urgency": "urgent",
        "location": "India",
    },
    {
        "id": "india-aasra",
        "title": "AASRA 24x7",
        "description": "Suicide prevention and crisis support.",
        "url": "http://www.aasra.info",
        "phone": "+91-9820466726",
        "topic": "crisis",
        "urgency": "urgent",
        "location": "India",
    },
    {
        "id": "india-vandrevala",
        "title": "Vandrevala Foundation",
        "description": "Mental health helpline with phone and chat support.",
        "url": "https://www.vandrevalafoundation.com",
        "phone": "+91-9999666555",
        "topic": "crisis",
        "urgency": "urgent",
        "location": "India",
    },
    {
        "id": "us-988",
        "title": "988 Suicide & Crisis Lifeline",
        "description": "Free, confidential support in the United States and territories.",
        "url": "https://988lifeline.org",
        "phone": "988",
        "topic": "crisis",
        "urgency": "urgent",
        "location": "US",
    },
    {
        "id": "uk-samaritans",
        "title": "Samaritans",
        "description": "24/7 emotional support in the United Kingdom and Ireland.",
        "url": "https://www.samaritans.org",
        "phone": "116 123",
        "topic": "crisis",
        "urgency": "urgent",
        "location": "UK",
    },
]


def get_resources(topic: str | None = None) -> list[dict[str, str | None]]:
    if not topic:
        return list(RESOURCE_ITEMS)
    filtered = [item for item in RESOURCE_ITEMS if item["topic"].lower() == topic.lower()]
    return filtered


def get_crisis_resources(country: str | None = None) -> list[dict[str, str | None]]:
    if not country:
        return list(CRISIS_RESOURCES)
    filtered = [item for item in CRISIS_RESOURCES if (item.get("location") or "").lower() == country.lower()]
    return filtered or [item for item in CRISIS_RESOURCES if (item.get("location") or "").lower() == "global"]


def merge_resources(*resource_sets: Iterable[dict[str, str | None]]) -> list[dict[str, str | None]]:
    merged: list[dict[str, str | None]] = []
    for resource_set in resource_sets:
        merged.extend(resource_set)
    return merged
