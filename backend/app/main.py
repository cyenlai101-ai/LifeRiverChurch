from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import auth, care, dashboard, events, health, prayers, registrations, admin_users, weekly_verse, sunday_messages
import app.models  # noqa: F401
from app.core.config import settings


app = FastAPI(title="Liferiverchurch API", version="0.1.0")

STATIC_DIR = Path(__file__).resolve().parents[1] / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.allowed_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(events.router)
app.include_router(registrations.router)
app.include_router(prayers.router)
app.include_router(care.router)
app.include_router(admin_users.router)
app.include_router(weekly_verse.router)
app.include_router(sunday_messages.router)
