"""Shared LangChain runtime helpers for text LLM calls."""

from __future__ import annotations

import logging
from typing import Any

from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_TEMPERATURE

LOGGER = logging.getLogger(__name__)


def _normalise_content(content: Any) -> str:
    """Normalise LangChain message content into plain text."""
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                if item.strip():
                    parts.append(item.strip())
                continue
            if isinstance(item, dict):
                text = item.get("text")
                if isinstance(text, str) and text.strip():
                    parts.append(text.strip())
        return "\n".join(parts).strip()

    return str(content).strip()


def build_chat_model(*, model: str | None = None, temperature: float | None = None):
    """Return a LangChain Gemini chat model or None when unavailable."""
    api_key = (GEMINI_API_KEY or "").strip()
    if not api_key:
        return None

    try:
        return ChatGoogleGenerativeAI(
            model=model or GEMINI_MODEL,
            temperature=GEMINI_TEMPERATURE if temperature is None else temperature,
            api_key=api_key,
        )
    except Exception as exc:
        LOGGER.warning("Gemini model initialization failed; using fallback mode: %s", exc)
        return None


def invoke_llm_text(
    prompt: str,
    *,
    model: str | None = None,
    temperature: float | None = None,
) -> str | None:
    """Invoke Gemini via LangChain and return response text, else None."""
    llm = build_chat_model(model=model, temperature=temperature)
    if llm is None:
        return None

    try:
        response = llm.invoke(prompt)
        text = _normalise_content(response.content)
        return text or None
    except Exception as exc:
        LOGGER.warning("Gemini invocation failed; using fallback mode: %s", exc)
        return None
