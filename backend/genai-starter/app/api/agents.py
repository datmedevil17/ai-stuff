"""API: War Room multi-agent analysis endpoint."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.db.crud import get_profile
from app.persona_engine.aggregator import run_persona_engine
from app.agents.war_room import run_war_room

router = APIRouter(prefix="/analyze", tags=["Agents"])


class WarRoomResponse(BaseModel):
    user_id: str
    data_report: str | None
    tax_report: str | None
    portfolio_report: str | None
    risk_report: str | None
    fire_report: str | None
    final_synthesis: str | None
    agent_logs: list[str]
    personas: list[dict]


@router.get("/war-room/{user_id}", response_model=WarRoomResponse)
def run_financial_war_room(user_id: str):
    """Trigger the LangGraph multi-agent analysis for a user."""
    profile = get_profile(user_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="User not found. Ingest data first.")

    # 1. Run persona engine first to get the 'identity'
    persona_result = run_persona_engine(profile)

    # 2. Execute the 6-agent graph with personas context
    result = run_war_room(profile, existing_personas=persona_result.personas)

    return WarRoomResponse(
        user_id=user_id,
        data_report=result["data_report"],
        tax_report=result["tax_report"],
        portfolio_report=result["portfolio_report"],
        risk_report=result["risk_report"],
        fire_report=result["fire_report"],
        final_synthesis=result["final_synthesis"],
        agent_logs=result["agent_logs"],
        personas=[m.model_dump() for m in result["personas"]]
    )
