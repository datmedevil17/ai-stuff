from typing import List, Optional, Dict, Any, TypedDict
from pydantic import BaseModel, Field

class UserProfile(BaseModel):
    age: int
    profession: str
    annual_income_inr: float
    monthly_expenses_inr: float
    dependents: int
    personas: List[str]

class Assets(BaseModel):
    equity_stocks_inr: float
    crypto_inr: float
    bank_balance_inr: float
    epf_inr: float

class Liabilities(BaseModel):
    education_loan_inr: float
    monthly_emi_inr: float

class Insurance(BaseModel):
    term_cover_inr: float
    health_cover_inr: float

class BlackboardInput(BaseModel):
    user_profile: UserProfile
    assets: Assets
    liabilities: Liabilities
    insurance: Insurance

class AgentState(TypedDict):
    # Core Inputs
    user_profile: Dict[str, Any]
    assets: Dict[str, Any]
    liabilities: Dict[str, Any]
    insurance: Dict[str, Any]
    
    # Agent Outputs (Incremental updates)
    data_surgeon_output: Optional[Dict[str, Any]]
    tax_wizard_output: Optional[Dict[str, Any]]
    portfolio_xray_output: Optional[Dict[str, Any]]
    
    # Our Additions (Agents 4, 5, 6)
    risk_shield_output: Optional[Dict[str, Any]]
    fire_planner_output: Optional[Dict[str, Any]]
    exec_narrator_output: Optional[Dict[str, Any]]
