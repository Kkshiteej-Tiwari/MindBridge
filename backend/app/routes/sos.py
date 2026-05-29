from __future__ import annotations

from fastapi import APIRouter

from ..models.sos import SOSRouteRequest, SOSRouteResponse
from ..services.sos import route_sos

router = APIRouter(prefix="/sos", tags=["sos"])


@router.post("/route", response_model=SOSRouteResponse)
def build_sos_route(payload: SOSRouteRequest) -> SOSRouteResponse:
    return route_sos(payload)
