"""Unit tests for the rule-based persona engine."""

import pytest
from app.models.user import UserProfile
from app.models.persona import Persona
from app.persona_engine.rule_based import apply_rules


def _make_profile(**kwargs) -> UserProfile:
    defaults = dict(
        user_id="test-user",
        age=30,
        annual_income=600_000,
        monthly_expenses=25_000,
        total_assets=0,
        total_liabilities=0,
        monthly_emi=0,
        has_life_insurance=False,
        has_health_insurance=False,
        dependents=0,
        goals=[],
    )
    defaults.update(kwargs)
    return UserProfile(**defaults)


class TestYoungInvestor:
    def test_young_no_dependents(self):
        profile = _make_profile(age=25, annual_income=500_000, dependents=0)
        matches = apply_rules(profile)
        personas = [m.persona for m in matches]
        assert Persona.YOUNG_INVESTOR in personas

    def test_old_not_young_investor(self):
        profile = _make_profile(age=35, annual_income=500_000, dependents=0)
        matches = apply_rules(profile)
        personas = [m.persona for m in matches]
        assert Persona.YOUNG_INVESTOR not in personas


class TestDebtStressed:
    def test_high_emi_ratio(self):
        # Monthly income = 600000/12 = 50000, EMI = 25000 → 50%
        profile = _make_profile(monthly_emi=25_000)
        matches = apply_rules(profile)
        personas = [m.persona for m in matches]
        assert Persona.DEBT_STRESSED in personas

    def test_low_emi_not_stressed(self):
        profile = _make_profile(monthly_emi=5_000)
        matches = apply_rules(profile)
        personas = [m.persona for m in matches]
        assert Persona.DEBT_STRESSED not in personas


class TestWealthBuilder:
    def test_high_assets_and_income(self):
        profile = _make_profile(total_assets=500_000, annual_income=1_200_000)
        matches = apply_rules(profile)
        personas = [m.persona for m in matches]
        assert Persona.WEALTH_BUILDER in personas

    def test_low_income_not_builder(self):
        profile = _make_profile(total_assets=500_000, annual_income=400_000)
        matches = apply_rules(profile)
        personas = [m.persona for m in matches]
        assert Persona.WEALTH_BUILDER not in personas


class TestRetirementPlanner:
    def test_retirement_goal_old(self):
        profile = _make_profile(age=50, goals=["retirement"])
        matches = apply_rules(profile)
        personas = [m.persona for m in matches]
        assert Persona.RETIREMENT_PLANNER in personas
        match = next(m for m in matches if m.persona == Persona.RETIREMENT_PLANNER)
        assert match.confidence == 0.90

    def test_retirement_goal_young(self):
        profile = _make_profile(age=28, goals=["retirement"])
        matches = apply_rules(profile)
        personas = [m.persona for m in matches]
        assert Persona.RETIREMENT_PLANNER in personas
        match = next(m for m in matches if m.persona == Persona.RETIREMENT_PLANNER)
        assert match.confidence == 0.60


class TestUnderinsured:
    def test_no_insurance_with_dependents(self):
        profile = _make_profile(dependents=2)
        matches = apply_rules(profile)
        personas = [m.persona for m in matches]
        assert Persona.UNDERINSURED in personas

    def test_insured_not_flagged(self):
        profile = _make_profile(has_life_insurance=True, dependents=2)
        matches = apply_rules(profile)
        personas = [m.persona for m in matches]
        assert Persona.UNDERINSURED not in personas


class TestCashFlowTight:
    def test_high_expense_ratio(self):
        # Monthly income = 600000/12 = 50000, expenses = 45000 → 90%
        profile = _make_profile(monthly_expenses=45_000)
        matches = apply_rules(profile)
        personas = [m.persona for m in matches]
        assert Persona.CASH_FLOW_TIGHT in personas


class TestMultiplePersonas:
    def test_can_match_multiple(self):
        """A user should be able to match multiple personas simultaneously."""
        profile = _make_profile(
            age=25,
            annual_income=600_000,
            monthly_expenses=45_000,  # Cash flow tight
            dependents=0,
            monthly_emi=25_000,  # Debt stressed
        )
        matches = apply_rules(profile)
        personas = set(m.persona for m in matches)
        assert len(personas) >= 2
        assert Persona.YOUNG_INVESTOR in personas
        assert Persona.DEBT_STRESSED in personas
        assert Persona.CASH_FLOW_TIGHT in personas
