from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class Persona(str, Enum):
    YOUNG_INVESTOR = "YOUNG_INVESTOR"
    DEBT_STRESSED = "DEBT_STRESSED"
    WEALTH_BUILDER = "WEALTH_BUILDER"
    RETIREMENT_PLANNER = "RETIREMENT_PLANNER"
    UNDER_INSURED = "UNDER_INSURED"
    CASH_FLOW_TIGHT = "CASH_FLOW_TIGHT"
    CONSERVATIVE_SAVER = "CONSERVATIVE_SAVER"
    AGGRESSIVE_INVESTOR = "AGGRESSIVE_INVESTOR"

class Recommendation(BaseModel):
    title: str
    description: str
    priority: int
    tags: List[str] = Field(default_factory=list)

class UserProfile(BaseModel):
    user_id: str
    age: Optional[int] = None
    annual_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    total_assets: Optional[float] = None
    total_debt: Optional[float] = None
    has_life_insurance: Optional[bool] = None
    has_health_insurance: Optional[bool] = None
    emi_payments: Optional[float] = None
    personas: List[Persona] = Field(default_factory=list)
    recommendations: List[Recommendation] = Field(default_factory=list)
