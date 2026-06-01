import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend directory so env vars like GEMINI_API_KEY are available
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes.health import router as health_router
from .routes.journal import router as journal_router
from .routes.chat import router as chat_router
from .routes.community import router as community_router
from .routes.challenges import router as challenges_router
from .routes.resources import router as resources_router
from .routes.stress import router as stress_router
from .routes.analysis import router as analysis_router
from .routes.peer_chat import router as peer_chat_router
from .routes.sentiment import router as sentiment_router
from .routes.sos import router as sos_router

app = FastAPI(title="MindBridge Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(journal_router)
app.include_router(chat_router)
app.include_router(community_router)
app.include_router(challenges_router)
app.include_router(resources_router)
app.include_router(stress_router)
app.include_router(analysis_router)
app.include_router(peer_chat_router)
app.include_router(sentiment_router)
app.include_router(sos_router)
