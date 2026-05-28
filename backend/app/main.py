from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from .routes.health import router as health_router
from .routes.journal import router as journal_router
from .routes.chat import router as chat_router
from .routes.community import router as community_router
from .routes.challenges import router as challenges_router
from .routes.resources import router as resources_router
from .routes.sos import router as sos_router
from .routes.stress import router as stress_router
from .routes.sentiment import router as sentiment_router
from .services.realtime import sio

# inner FastAPI app
api = FastAPI(title="MindBridge Backend", version="0.1.0")

api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api.include_router(health_router)
api.include_router(journal_router)
api.include_router(chat_router)
api.include_router(community_router)
api.include_router(challenges_router)
api.include_router(resources_router)
api.include_router(sos_router)
api.include_router(stress_router)
api.include_router(sentiment_router)

# Wrap FastAPI with Socket.IO ASGI app so uvicorn serves both
app = socketio.ASGIApp(sio, other_asgi_app=api)
