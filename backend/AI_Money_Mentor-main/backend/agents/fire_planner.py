import json
from langchain_core.prompts import ChatPromptTemplate
from agents.llm_runtime import get_structured_llm
from models.blackboard import AgentState
from models.agent_outputs import FirePlannerOutput

structured_llm = get_structured_llm(FirePlannerOutput)

def fire_planner_node(state: AgentState) -> AgentState:
    """
    FIRE Planner Agent:
    Calculates the 'Freedom Number' and retirement roadmap.
    """
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are the 'FIRE Planner', an expert AI financial independence and early retirement advisor.
Your job is to analyze the user's monthly expenses, age, and current total assets.
Calculate the Freedom Number (corpus needed to retire), assuming a reasonable multiple of annual expenses.
Project the retirement age based on current assets and required monthly SIP.
Generate an investment roadmap including the required monthly SIP, assumed inflation (e.g., '6%'), and assumed market return (e.g., '12%').
Ensure you return exactly the requested JSON output structure.
If data is missing, estimate reasonably or indicate failure status."""),
        ("user", "Here is the user's data:\n\n{data}")
    ])
    
    # Format incoming data into a string
    data_dict = {
        "user_profile": state.get("user_profile"),
        "assets": state.get("assets")
    }
    
    try:
        if structured_llm is None:
            raise RuntimeError("Gemini model unavailable. Set GEMINI_API_KEY to enable live analysis.")
        chain = prompt | structured_llm
        response = chain.invoke({"data": json.dumps(data_dict, indent=2)})
        state["fire_planner_output"] = response.model_dump()
    except Exception as e:
        state["fire_planner_output"] = {
            "agent": "FIRE Planner",
            "status": "failure",
            "freedom_number_inr": 0,
            "projected_retirement_age": 0,
            "roadmap": {
                "required_monthly_sip": 0,
                "assumed_inflation": "Unknown",
                "assumed_market_return": f"Error: {str(e)}"
            }
        }
    
    return state

if __name__ == "__main__":
    from models.blackboard import AgentState
    mock_state = AgentState(
        user_profile={"age": 23, "monthly_expenses_inr": 45000},
        assets={"equity_stocks_inr": 300000, "crypto_inr": 100000, "bank_balance_inr": 50000, "epf_inr": 80000},
        liabilities={},
        insurance={},
        data_surgeon_output=None,
        tax_wizard_output=None,
        portfolio_xray_output=None,
        risk_shield_output=None,
        fire_planner_output=None,
        exec_narrator_output=None
    )
    result = fire_planner_node(mock_state)
    print(json.dumps(result["fire_planner_output"], indent=2))
