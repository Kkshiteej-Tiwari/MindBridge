# MindBridge

MindBridge is a full-stack student wellness app with a React dashboard, journal, coach, community, stress, challenges, resources, and SOS flows on the frontend, backed by a FastAPI service for persistence, analysis, and realtime-friendly features.

## Live Demo

Dashboard: https://mindbridge-0001.web.app/dashboard

## What It Does

- Personal wellness dashboard for at-a-glance status and guidance.
- Journaling flow with history and sentiment-style analysis support.
- Coach, community, peer chat, challenges, resources, and stress tools.
- SOS entry point for fast help access.
- FastAPI backend with modular routes and JSON-backed stores for local development.

## Tech Stack

- Frontend: React, Vite, React Router, Framer Motion, React Query, Redux Toolkit, Tailwind CSS.
- Backend: FastAPI, Uvicorn, Pydantic, httpx, Redis, Motor, PyMongo, Socket.IO, OpenAI, Firebase Admin.
- Tooling: Vite build pipeline, Tailwind/PostCSS, Python virtual environment.

## Project Structure

```text
backend/
  app/
    main.py            # FastAPI app and router registration
    routes/             # API endpoints by feature
    services/           # Store, analysis, realtime, and feature logic
    models/             # Pydantic request/response models
  data/                 # Local JSON store files used by the services
frontend/
  src/
    App.jsx             # Main router and shell
    features/           # Feature pages and supporting components
    services/           # Frontend API client
```

## Prerequisites

- Python 3.10+ recommended.
- Node.js 18+ recommended.
- npm or another compatible package manager.

## Local Setup

### Backend

From the repo root:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend uses `http://127.0.0.1:8000` by default. To point it at another backend, set `VITE_API_URL` before starting Vite.

## Environment Variables

Frontend:

- `VITE_API_URL` - overrides the API base URL used by the browser client.

Backend:

- Environment variables depend on the services you enable for a given deployment.
- The codebase is set up to work with local JSON-backed storage during development.

## API Overview

The backend exposes modular routes for:

- `/health`
- `/journal`
- `/chat`
- `/community`
- `/challenges`
- `/resources`
- `/stress`
- `/analysis`
- `/peer-chat`
- `/sentiment`
- `/sos`

## Frontend Routes

- `/dashboard`
- `/` for the journal experience
- `/coach`
- `/stress`
- `/community`
- `/challenges`
- `/resources`
- `/sos`

## Deployment Notes

- The deployed dashboard is available at the live URL above.
- The frontend router is configured with `BrowserRouter`, so direct navigation to `/dashboard` works in the deployed app.

## Suggested Commit Message

- `Add README with deployed dashboard link`
