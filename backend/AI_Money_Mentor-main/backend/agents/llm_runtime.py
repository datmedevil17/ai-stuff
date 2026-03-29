from __future__ import annotations

import logging

from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel

from config import settings

LOGGER = logging.getLogger(__name__)


def get_structured_llm(
    schema: type[BaseModel],
    *,
    model: str | None = None,
    temperature: float | None = None,
):
    """Return a structured Gemini model, or None when unavailable.

    This keeps the backend usable in local/dev mode even without cloud credentials.
    """

    api_key = (settings.gemini_api_key or "").strip()
    if not api_key:
        LOGGER.info("GEMINI_API_KEY not configured; agents will use fallback responses")
        return None

    try:
        llm = ChatGoogleGenerativeAI(
            model=model or settings.gemini_model,
            api_key=api_key,
            temperature=settings.gemini_temperature if temperature is None else temperature,
        )
        return llm.with_structured_output(schema)
    except Exception as exc:
        LOGGER.warning("Gemini client initialization failed; using fallback responses: %s", exc)
        return None
