import json
from agents.war_room import app_chain
from api.agents import DEMO_BLACKBOARD

if __name__ == "__main__":
    print("Running merged LangGraph workflow with full 6 agents...")
    
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

    final_state = app_chain.invoke(initial_state)

    # Collect outputs just like the API does
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
        
    print("\n--- FINAL JSON EXPORT (LIKE API) ---")
    print(json.dumps(outputs, indent=2))
