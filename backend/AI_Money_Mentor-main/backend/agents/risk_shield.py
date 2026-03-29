import json
from langchain_core.prompts import ChatPromptTemplate
from agents.llm_runtime import get_structured_llm
from models.blackboard import AgentState
from models.agent_outputs import RiskShieldOutput

structured_llm = get_structured_llm(RiskShieldOutput)

def risk_shield_node(state: AgentState) -> AgentState:
    """
    Risk Shield Agent:
    Calculates Life Value, checks EMI stress, and insurance adequacy.
    """
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are the 'Risk Shield', an expert AI financial risk assessor. 
Your job is to analyze the user's liabilities, income, dependents, and insurance.
Calculate the EMI stress level (e.g., 'Safe (9% of Income)').
Calculate the Human Life Value (insurance needed) based on dependents, income, and liabilities.
Compare it with current_term_cover to find the deficit.
Provide one highly actionable priority step.
Ensure you return exactly the requested JSON output structure.
If data is missing, estimate reasonably or indicate failure status."""),
        ("user", "Here is the user's data:\n\n{data}")
    ])
    
    # Format incoming data into a string
    data_dict = {
        "user_profile": state.get("user_profile"),
        "liabilities": state.get("liabilities"),
        "insurance": state.get("insurance")
    }
    
    try:
        if structured_llm is None:
            raise RuntimeError("Gemini model unavailable. Set GEMINI_API_KEY to enable live analysis.")
        chain = prompt | structured_llm
        response = chain.invoke({"data": json.dumps(data_dict, indent=2)})
        state["risk_shield_output"] = response.model_dump()
    except Exception as e:
        state["risk_shield_output"] = {
            "agent": "Risk Shield",
            "status": "failure",
            "emi_stress_level": "Unknown",
            "insurance_gap": {
                "human_life_value": 0,
                "current_term_cover": 0,
                "deficit": 0
            },
            "actionable": f"LLM parsing failed: {str(e)}"
        }
    
    return state

if __name__ == "__main__":
    from models.blackboard import AgentState
    mock_state = AgentState(
        user_profile={"annual_income_inr": 1500000, "dependents": 2},
        liabilities={"monthly_emi_inr": 12000},
        insurance={"term_cover_inr": 0, "health_cover_inr": 300000},
        assets={},
        data_surgeon_output=None,
        tax_wizard_output=None,
        portfolio_xray_output=None,
        risk_shield_output=None,
        fire_planner_output=None,
        exec_narrator_output=None
    )
    result = risk_shield_node(mock_state)
    print(json.dumps(result["risk_shield_output"], indent=2))
