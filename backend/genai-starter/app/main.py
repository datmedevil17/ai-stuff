"""FastAPI application entry point."""

from __future__ import annotations

from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.db.database import init_db
from app.api import structured, documents, chat, personas, agents

# Initialise database tables
init_db()

app = FastAPI(
    title="Financial Persona Segmentation Engine",
    description="3-layer persona engine: Rule-Based + K-Means Clustering + LLM Tagging",
    version="1.0.0",
)

# ── Register API routers ─────────────────────────────────────────────
app.include_router(structured.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(personas.router)
app.include_router(agents.router)

# ── Serve frontend ───────────────────────────────────────────────────
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/")
    def serve_frontend():
        return FileResponse(str(FRONTEND_DIR / "index.html"))
