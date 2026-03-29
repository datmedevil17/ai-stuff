"""Layer 1 — Rule-Based Persona Assignment.

Hard-coded financial rules that map signal patterns to persona tags.
A user can match multiple rules simultaneously.
"""

from __future__ import annotations

from app.models.user import UserProfile
from app.models.persona import Persona, PersonaMatch


def apply_rules(profile: UserProfile) -> list[PersonaMatch]:
    """Evaluate all rules against a user profile.

    Returns a list of PersonaMatch objects for every rule that fires.
    """
    matches: list[PersonaMatch] = []

    # ── YOUNG_INVESTOR ───────────────────────────────────────────
    if profile.age < 30 and profile.annual_income > 0 and profile.dependents == 0:
        matches.append(PersonaMatch(
            persona=Persona.YOUNG_INVESTOR,
            confidence=0.85,
            source="rule",
            reasoning=f"Age {profile.age} < 30, has income, no dependents",
        ))

    # ── DEBT_STRESSED ────────────────────────────────────────────
    if profile.emi_to_income_ratio > 0.40:
        matches.append(PersonaMatch(
            persona=Persona.DEBT_STRESSED,
            confidence=0.90,
            source="rule",
            reasoning=f"EMI/income ratio {profile.emi_to_income_ratio:.0%} exceeds 40% threshold",
        ))

    # ── WEALTH_BUILDER ───────────────────────────────────────────
    if profile.total_assets > 0 and profile.annual_income > 1_000_000:
        matches.append(PersonaMatch(
            persona=Persona.WEALTH_BUILDER,
            confidence=0.80,
            source="rule",
            reasoning=f"Has assets worth ₹{profile.total_assets:,.0f} and income > ₹10L",
        ))

    # ── RETIREMENT_PLANNER ───────────────────────────────────────
    if "retirement" in profile.goals and profile.age >= 45:
        matches.append(PersonaMatch(
            persona=Persona.RETIREMENT_PLANNER,
            confidence=0.90,
            source="rule",
            reasoning=f"Has retirement goal and age {profile.age} ≥ 45",
        ))
    elif "retirement" in profile.goals and profile.age < 45:
        matches.append(PersonaMatch(
            persona=Persona.RETIREMENT_PLANNER,
            confidence=0.60,
            source="rule",
            reasoning=f"Has retirement goal but relatively young (age {profile.age})",
        ))

    # ── UNDERINSURED ─────────────────────────────────────────────
    if not profile.has_insurance and profile.dependents > 0:
        matches.append(PersonaMatch(
            persona=Persona.UNDERINSURED,
            confidence=0.95,
            source="rule",
            reasoning=f"No insurance but has {profile.dependents} dependent(s)",
        ))
    elif not profile.has_life_insurance and profile.annual_income > 500_000:
        matches.append(PersonaMatch(
            persona=Persona.UNDERINSURED,
            confidence=0.70,
            source="rule",
            reasoning="No life insurance despite income > ₹5L",
        ))

    # ── CASH_FLOW_TIGHT ─────────────────────────────────────────
    if profile.expense_ratio > 0.80:
        matches.append(PersonaMatch(
            persona=Persona.CASH_FLOW_TIGHT,
            confidence=0.85,
            source="rule",
            reasoning=f"Expense ratio {profile.expense_ratio:.0%} exceeds 80% of income",
        ))

    # ── CONSERVATIVE_SAVER ───────────────────────────────────────
    if profile.total_assets > 0 and profile.total_liabilities == 0 and profile.expense_ratio < 0.50:
        matches.append(PersonaMatch(
            persona=Persona.CONSERVATIVE_SAVER,
            confidence=0.70,
            source="rule",
            reasoning="Has assets, no liabilities, and expenses < 50% of income",
        ))

    # ── AGGRESSIVE_INVESTOR ──────────────────────────────────────
    if profile.total_assets > profile.annual_income * 2 and profile.age < 40:
        matches.append(PersonaMatch(
            persona=Persona.AGGRESSIVE_INVESTOR,
            confidence=0.65,
            source="rule",
            reasoning=f"Asset base > 2× annual income and age {profile.age} < 40",
        ))

    return matches
