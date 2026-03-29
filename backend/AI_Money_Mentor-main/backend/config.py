import os
from pydantic_settings import BaseSettings


def _float_env(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return float(raw)
    except ValueError:
        return default

class Settings(BaseSettings):
    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    database_name: str = "finpersona"
    chromadb_path: str = "./data/chromadb"
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    gemini_temperature: float = _float_env("GEMINI_TEMPERATURE", 0.1)

    class Config:
        env_file = [".env", "../.env"]

settings = Settings()
