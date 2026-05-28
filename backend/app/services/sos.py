from __future__ import annotations

from urllib.parse import quote

from ..models.sos import SOSAction, SOSRouteRequest, SOSRouteResponse, SOSStep
from .resources import get_crisis_resources


def _tel_href(phone: str | None) -> str:
    if not phone:
        return "#"
    cleaned = phone.replace(" ", "").replace("-", "")
    return f"tel:{cleaned}"


def _build_steps(risk_level: str) -> list[SOSStep]:
    if risk_level == "crisis":
        return [
            SOSStep(title="Move to a safer space", description="Step away from anything you could use to hurt yourself."),
            SOSStep(title="Call for help now", description="Use the primary helpline or contact emergency services right away."),
            SOSStep(title="Message one trusted person", description="Ask someone to stay with you or keep you on the phone."),
        ]
    if risk_level == "distressed":
        return [
            SOSStep(title="Slow the moment down", description="Take 10 slow breaths and sip water before deciding the next step."),
            SOSStep(title="Reach support early", description="Text or call a trusted person before the stress grows."),
            SOSStep(title="Use a grounding tool", description="Open a breathing or grounding exercise and stay with it for 2 minutes."),
        ]
    if risk_level == "elevated":
        return [
            SOSStep(title="Reduce load", description="Drop one non-essential task from today if you can."),
            SOSStep(title="Open a calm resource", description="Use a grounding exercise or study plan to reset your rhythm."),
            SOSStep(title="Check in later", description="Set a reminder to revisit how you feel in 30 minutes."),
        ]
    return [
        SOSStep(title="Keep the day steady", description="Protect this calmer window with breaks and a simple plan."),
        SOSStep(title="Stay connected", description="Let someone know you are doing okay and ask them to check in later."),
        SOSStep(title="Review support options", description="Save one helpline and one grounding resource for later."),
    ]


def route_sos(payload: SOSRouteRequest) -> SOSRouteResponse:
    resources = get_crisis_resources(payload.country)
    primary_resource = resources[0] if resources else None

    if payload.risk_level == "crisis":
        title = "SOS route activated"
        summary = "This is the fastest path to immediate support. Use the call button now and bring a trusted person in." 
        primary_action = SOSAction(
            label="Call now",
            description="Contact emergency support immediately and stay with a trusted person.",
            href=_tel_href(primary_resource.get("phone") if primary_resource else "112"),
            tone="urgent",
        )
    elif payload.risk_level == "distressed":
        title = "Support route ready"
        summary = "You do not need to handle this alone. Take one grounding step, then reach out." 
        primary_action = SOSAction(
            label="Reach out now",
            description="Message a trusted person or open a crisis helpline if the feeling gets stronger.",
            href=_tel_href(primary_resource.get("phone") if primary_resource else None),
            tone="warning",
        )
    elif payload.risk_level == "elevated":
        title = "Preventive check-in"
        summary = "Stress is building. Use a short reset now so it does not escalate later." 
        primary_action = SOSAction(
            label="Open grounding tools",
            description="Use a calming resource and keep the next hour small and manageable.",
            href="/resources",
            tone="calm",
        )
    else:
        title = "Wellness support route"
        summary = "You look okay right now. Keep a support plan handy in case your stress changes later." 
        primary_action = SOSAction(
            label="Browse support",
            description="Save a grounding tool and a helpline before you need it.",
            href="/resources",
            tone="calm",
        )

    steps = _build_steps(payload.risk_level)
    if primary_resource and primary_resource.get("url"):
        primary_action.href = primary_resource["url"]

    return SOSRouteResponse(
        title=title,
        summary=summary + f" Selected region: {payload.country}.",
        country=payload.country,
        risk_level=payload.risk_level,
        primary_action=primary_action,
        steps=steps,
        resources=resources,
    )
