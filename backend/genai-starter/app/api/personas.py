"""API: Persona analysis and recommendation endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.persona import PersonaResult
from app.models.recommendation import RecommendationResult
from app.db.crud import get_profile, save_persona_result
from app.persona_engine.aggregator import run_persona_engine
from app.recommendations.engine import generate_recommendations

router = APIRouter(tags=["Personas"])


class FullAnalysisResponse(BaseModel):
    user_id: str
    personas: list[dict]
    primary_persona: str | None
    recommendations: list[dict]
    persona_names: list[str]


@router.get("/personas/{user_id}", response_model=FullAnalysisResponse)
def analyse_user(user_id: str):
    """Run the full 3-layer persona engine on a user and return
    personas + recommendations.
    """
    profile = get_profile(user_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="User not found. Ingest data first.")

    # Run persona engine
    persona_result: PersonaResult = run_persona_engine(profile)
    save_persona_result(persona_result)

    # Generate recommendations
    rec_result: RecommendationResult = generate_recommendations(persona_result)

    return FullAnalysisResponse(
        user_id=user_id,
        personas=[m.model_dump() for m in persona_result.personas],
        primary_persona=persona_result.primary_persona.value if persona_result.primary_persona else None,
        recommendations=[r.model_dump() for r in rec_result.recommendations],
        persona_names=persona_result.persona_names(),
    )


@router.get("/profile/{user_id}")
def get_user_profile(user_id: str):
    """Return the current merged profile for a user."""
    profile = get_profile(user_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="User not found.")
    return profile.model_dump()
