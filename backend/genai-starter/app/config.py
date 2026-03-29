"""Application configuration — loads from .env file."""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


def _float_env(name: str, default: float) -> float:
	"""Safely parse float env vars without crashing startup on bad input."""
	raw = os.getenv(name)
	if raw is None:
		return default
	try:
		return float(raw)
	except ValueError:
		return default

# Project Root
BASE_DIR = Path(__file__).resolve().parent.parent

GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_TEMPERATURE: float = _float_env("GEMINI_TEMPERATURE", 0.2)
DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{BASE_DIR}/data/app.db")
CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", str(BASE_DIR / "data" / "chroma"))

# Persona engine settings
KMEANS_N_CLUSTERS: int = int(os.getenv("KMEANS_N_CLUSTERS", "6"))
MIN_USERS_FOR_CLUSTERING: int = int(os.getenv("MIN_USERS_FOR_CLUSTERING", "10"))
