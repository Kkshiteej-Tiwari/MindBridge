from __future__ import annotations

import logging
import socketio

from ..services.community_store import create_post, add_reaction

logger = logging.getLogger("realtime")

# Async Socket.IO server
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

def _room_member_count(room: str, namespace: str = "/") -> int:
    """Return active socket count for a room with safe fallbacks."""
    try:
        namespace_rooms = sio.manager.rooms.get(namespace, {})
        members = namespace_rooms.get(room)
        return len(members) if members is not None else 0
    except Exception:
        return 0


@sio.event
async def connect(sid, environ):
    logger.info("socket connect: %s", sid)


@sio.event
async def disconnect(sid):
    logger.info("socket disconnect: %s", sid)


@sio.event
async def join(sid, data):
    data = data or {}
    room = data.get("room", "global")
    await sio.save_session(sid, {"room": room})
    await sio.enter_room(sid, room)
    await sio.emit("presence", {"room": room, "count": _room_member_count(room)}, room=room)
    logger.info("%s joined %s", sid, room)


@sio.event
async def leave(sid, data):
    data = data or {}
    room = data.get("room", "global")
    await sio.leave_room(sid, room)
    await sio.emit("presence", {"room": room, "count": _room_member_count(room)}, room=room)
    logger.info("%s left %s", sid, room)


@sio.event
async def community_post(sid, data):
    """Expect data: { tempId, content, topic, mood }
    Persist via create_post and broadcast community.posted to room
    """
    data = data or {}
    room = data.get("room", "global")
    content = data.get("content", "")
    topic = data.get("topic", "General")
    mood = data.get("mood", "neutral")

    # persist post
    post = create_post(content, topic, mood)

    # broadcast to room
    await sio.emit("community.posted", post, room=room)
    # ack
    return {"ok": True, "post": post}


@sio.event
async def community_react(sid, data):
    """Expect data: { postId, reaction }
    Apply reaction and broadcast update
    """
    data = data or {}
    post_id = data.get("postId")
    reaction = data.get("reaction")
    try:
        updated = add_reaction(post_id, reaction)
    except Exception as exc:
        return {"ok": False, "error": str(exc)}

    await sio.emit("community.updated", updated)
    return {"ok": True, "post": updated}
