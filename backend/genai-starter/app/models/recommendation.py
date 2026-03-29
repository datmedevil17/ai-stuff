"""Recommendation data models."""

from __future__ import annotations

from pydantic import BaseModel, Field
from app.models.persona import Persona


class Recommendation(BaseModel):
    """A single actionable recommendation."""

    title: str
    description: str
    category: str = ""  # e.g. "insurance", "debt", "investment"
    priority: int = Field(1, ge=1, le=5, description="1 = highest priority")
    source_persona: Persona


class RecommendationResult(BaseModel):
    """All recommendations for a user, aggregated across personas."""

    user_id: str
    recommendations: list[Recommendation] = Field(default_factory=list)
    persona_names: list[str] = Field(default_factory=list)
