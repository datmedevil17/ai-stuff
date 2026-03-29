"""Persona definitions and result schemas."""

from __future__ import annotations

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class Persona(str, Enum):
    YOUNG_INVESTOR = "young_investor"
    DEBT_STRESSED = "debt_stressed"
    WEALTH_BUILDER = "wealth_builder"
    RETIREMENT_PLANNER = "retirement_planner"
    UNDERINSURED = "underinsured"
    CASH_FLOW_TIGHT = "cash_flow_tight"
    CONSERVATIVE_SAVER = "conservative_saver"
    AGGRESSIVE_INVESTOR = "aggressive_investor"


# Human-readable labels for each persona
PERSONA_LABELS: dict[Persona, str] = {
    Persona.YOUNG_INVESTOR: "Young Investor",
    Persona.DEBT_STRESSED: "Debt Stressed",
    Persona.WEALTH_BUILDER: "Wealth Builder",
    Persona.RETIREMENT_PLANNER: "Retirement Planner",
    Persona.UNDERINSURED: "Under-Insured",
    Persona.CASH_FLOW_TIGHT: "Cash-Flow Tight",
    Persona.CONSERVATIVE_SAVER: "Conservative Saver",
    Persona.AGGRESSIVE_INVESTOR: "Aggressive Investor",
}


class PersonaMatch(BaseModel):
    """A single persona hit with confidence and source layer."""

    persona: Persona
    confidence: float = Field(..., ge=0, le=1)
    source: str = Field(..., description="Which layer assigned this: rule | cluster | llm")
    reasoning: str = ""


class PersonaResult(BaseModel):
    """Aggregated multi-persona result for one user."""

    user_id: str
    personas: list[PersonaMatch] = Field(default_factory=list)
    primary_persona: Optional[Persona] = None

    def persona_names(self) -> list[str]:
        return [PERSONA_LABELS.get(p.persona, p.persona.value) for p in self.personas]
