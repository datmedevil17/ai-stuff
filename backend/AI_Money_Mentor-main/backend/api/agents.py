from fastapi import APIRouter
from agents.war_room import app_chain

router = APIRouter()

# Global Hardcoded Blackboard exactly as specified in the hackathon demo instructions.
DEMO_BLACKBOARD = {
    "user_profile": {
        "age": 23,
        "profession": "Software Engineer",
        "annual_income_inr": 1500000,
        "monthly_expenses_inr": 45000,
        "dependents": 2,
        "personas": ["YOUNG_INVESTOR", "UNDER_INSURED", "AGGRESSIVE_INVESTOR"]
    },
    "assets": {
        "equity_stocks_inr": 300000,
        "crypto_inr": 100000,
        "bank_balance_inr": 50000,
        "epf_inr": 80000
    },
    "liabilities": {
        "education_loan_inr": 400000,
        "monthly_emi_inr": 12000
    },
    "insurance": {
        "term_cover_inr": 0,
        "health_cover_inr": 300000
    }
}

@router.get("/analyze/war-room/{user_id}")
async def run_war_room(user_id: str):
    """
    Executes all 6 agents of the War Room
    using a hardcoded Global Blackboard schema.
    """
    
    # Initial AgentState
    initial_state = {
        "user_profile": DEMO_BLACKBOARD["user_profile"],
        "assets": DEMO_BLACKBOARD["assets"],
        "liabilities": DEMO_BLACKBOARD["liabilities"],
        "insurance": DEMO_BLACKBOARD["insurance"],
        "data_surgeon_output": None,
        "tax_wizard_output": None,
        "portfolio_xray_output": None,
        "risk_shield_output": None,
        "fire_planner_output": None,
        "exec_narrator_output": None
    }
    
    # Run the langgraph pipeline
    final_state = app_chain.invoke(initial_state)
    
    # Extract only the agent outputs for the frontend
    outputs = []
    if final_state.get("data_surgeon_output"):
        outputs.append(final_state["data_surgeon_output"])
    if final_state.get("tax_wizard_output"):
        outputs.append(final_state["tax_wizard_output"])
    if final_state.get("portfolio_xray_output"):
        outputs.append(final_state["portfolio_xray_output"])
    if final_state.get("risk_shield_output"):
        outputs.append(final_state["risk_shield_output"])
    if final_state.get("fire_planner_output"):
        outputs.append(final_state["fire_planner_output"])
    if final_state.get("exec_narrator_output"):
        outputs.append(final_state["exec_narrator_output"])
        
    return {
        "message": f"War Room Analysis complete for {user_id}",
        "outputs": outputs
    }
