from typing import List, Dict, Any, Literal
from pydantic import BaseModel, Field

# 1. Data Surgeon Output Schema
class Flag(BaseModel):
    type: Literal["warning", "info", "error"]
    message: str

class DataSurgeonOutput(BaseModel):
    agent: str = "Data Surgeon"
    status: Literal["success", "failure"]
    data_quality_score: int
    flags: List[Flag]
    verified: bool

# 2. Tax Wizard Output Schema
class TaxAnalysis(BaseModel):
    old_regime_tax: float
    new_regime_tax: float
    potential_savings: float

class TaxWizardOutput(BaseModel):
    agent: str = "Tax Wizard"
    status: Literal["success", "failure"]
    regime_recommendation: Literal["Old Regime", "New Regime"]
    analysis: TaxAnalysis
    gaps: List[str]

# 3. Portfolio X-Ray Output Schema
class PortfolioXRayOutput(BaseModel):
    agent: str = "Portfolio X-Ray"
    status: Literal["success", "failure"]
    current_allocation: Dict[str, str]
    target_allocation: Dict[str, str]
    insights: List[str]

# 4. Risk Shield Output Schema
class InsuranceGap(BaseModel):
    human_life_value: float
    current_term_cover: float
    deficit: float

class RiskShieldOutput(BaseModel):
    agent: str = "Risk Shield"
    status: Literal["success", "failure"]
    emi_stress_level: str
    insurance_gap: InsuranceGap
    actionable: str

# 5. FIRE Planner Output Schema
class Roadmap(BaseModel):
    required_monthly_sip: float
    assumed_inflation: str
    assumed_market_return: str

class FirePlannerOutput(BaseModel):
    agent: str = "FIRE Planner"
    status: Literal["success", "failure"]
    freedom_number_inr: float
    projected_retirement_age: int
    roadmap: Roadmap

# 6. Exec Narrator Output Schema
class Priority(BaseModel):
    title: str
    description: str

class ExecNarratorOutput(BaseModel):
    agent: str = "Exec Narrator"
    status: Literal["success", "failure"]
    executive_summary: str
    top_3_priorities: List[Priority]
