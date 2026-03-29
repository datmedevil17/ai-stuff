"""User and UserProfile data models."""

from __future__ import annotations

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class FinancialGoal(str, Enum):
    HOUSE = "house"
    RETIREMENT = "retirement"
    EDUCATION = "education"
    TRAVEL = "travel"
    EMERGENCY_FUND = "emergency_fund"
    WEDDING = "wedding"
    CAR = "car"
    OTHER = "other"


# ── Structured Input Schema ──────────────────────────────────────────

class StructuredInput(BaseModel):
    """What the user fills in the structured form."""

    age: int = Field(..., ge=18, le=100, description="User's age")
    annual_income: float = Field(..., ge=0, description="Annual income in INR")
    monthly_expenses: float = Field(..., ge=0, description="Monthly expenses in INR")

    # Assets
    mutual_funds: float = Field(0, ge=0, description="MF portfolio value")
    stocks: float = Field(0, ge=0, description="Stock portfolio value")
    fixed_deposits: float = Field(0, ge=0, description="FD value")
    other_assets: float = Field(0, ge=0)

    # Liabilities
    home_loan: float = Field(0, ge=0)
    car_loan: float = Field(0, ge=0)
    personal_loan: float = Field(0, ge=0)
    monthly_emi: float = Field(0, ge=0, description="Total monthly EMI")

    # Insurance
    has_life_insurance: bool = False
    has_health_insurance: bool = False
    life_insurance_cover: float = Field(0, ge=0)
    health_insurance_cover: float = Field(0, ge=0)

    # Family
    dependents: int = Field(0, ge=0)

    # Goals
    goals: list[FinancialGoal] = Field(default_factory=list)


# ── Internal Feature Profile ─────────────────────────────────────────

class UserProfile(BaseModel):
    """Normalised feature profile used by the persona engine.

    Built from structured inputs + LLM-extracted unstructured data.
    """

    user_id: str
    age: int = 0
    annual_income: float = 0
    monthly_expenses: float = 0

    # Aggregated asset / liability totals
    total_assets: float = 0
    total_liabilities: float = 0
    monthly_emi: float = 0

    # Insurance flags
    has_life_insurance: bool = False
    has_health_insurance: bool = False
    life_insurance_cover: float = 0
    health_insurance_cover: float = 0

    dependents: int = 0
    goals: list[str] = Field(default_factory=list)

    # Metadata — tracks which sources have contributed data
    sources: list[str] = Field(default_factory=list)

    # ── Derived helpers ──────────────────────────────────────────

    @property
    def expense_ratio(self) -> float:
        """Monthly expenses as a ratio of monthly income."""
        monthly_income = self.annual_income / 12
        return self.monthly_expenses / monthly_income if monthly_income > 0 else 0.0

    @property
    def emi_to_income_ratio(self) -> float:
        monthly_income = self.annual_income / 12
        return self.monthly_emi / monthly_income if monthly_income > 0 else 0.0

    @property
    def has_insurance(self) -> bool:
        return self.has_life_insurance or self.has_health_insurance

    def merge_from_structured(self, inp: StructuredInput) -> None:
        """Overlay structured form data onto this profile."""
        self.age = inp.age
        self.annual_income = inp.annual_income
        self.monthly_expenses = inp.monthly_expenses
        self.total_assets = inp.mutual_funds + inp.stocks + inp.fixed_deposits + inp.other_assets
        self.total_liabilities = inp.home_loan + inp.car_loan + inp.personal_loan
        self.monthly_emi = inp.monthly_emi
        self.has_life_insurance = inp.has_life_insurance
        self.has_health_insurance = inp.has_health_insurance
        self.life_insurance_cover = inp.life_insurance_cover
        self.health_insurance_cover = inp.health_insurance_cover
        self.dependents = inp.dependents
        self.goals = [g.value for g in inp.goals]
        if "structured_form" not in self.sources:
            self.sources.append("structured_form")

    def merge_extracted(self, extracted: dict, source_name: str) -> None:
        """Merge LLM-extracted fields into this profile (additive)."""
        for key, value in extracted.items():
            if hasattr(self, key) and value is not None:
                current = getattr(self, key)
                if isinstance(current, (int, float)) and isinstance(value, (int, float)):
                    # Keep the higher / newer value
                    if value > current:
                        setattr(self, key, value)
                elif isinstance(current, list) and isinstance(value, list):
                    setattr(self, key, list(set(current + value)))
                elif isinstance(current, bool) and isinstance(value, bool):
                    setattr(self, key, current or value)
        if source_name not in self.sources:
            self.sources.append(source_name)
