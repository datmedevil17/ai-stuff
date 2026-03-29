import json
from langchain_core.prompts import ChatPromptTemplate
from agents.llm_runtime import get_structured_llm
from models.blackboard import AgentState
from models.agent_outputs import ExecNarratorOutput

structured_llm = get_structured_llm(ExecNarratorOutput)

def exec_narrator_node(state: AgentState) -> AgentState:
    """
    Exec Narrator Agent:
    Synthesizes all previous outputs into a final strategy and top 3 priorities.
    """
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are the 'Exec Narrator', the chief financial strategist.
Your job is to read the outputs from the other specialized agents (Data Surgeon, Tax Wizard, Portfolio X-Ray, Risk Shield, FIRE Planner) along with the core user data.
Synthesize an 'executive_summary' highlighting their financial standing and uncompensated risks.
Provide exactly three 'top_3_priorities' based on the most critical alerts and opportunities found by the other agents.
Ensure you return exactly the requested JSON output structure.
If data is missing, estimate reasonably or indicate failure status."""),
        ("user", "Here is the combined analysis data:\n\n{data}")
    ])
    
    # Format incoming data into a string
    data_dict = {
        "user_profile": state.get("user_profile"),
        "data_surgeon": state.get("data_surgeon_output"),
        "tax_wizard": state.get("tax_wizard_output"),
        "portfolio_xray": state.get("portfolio_xray_output"),
        "risk_shield": state.get("risk_shield_output"),
        "fire_planner": state.get("fire_planner_output")
    }
    
    try:
        if structured_llm is None:
            raise RuntimeError("Gemini model unavailable. Set GEMINI_API_KEY to enable live analysis.")
        chain = prompt | structured_llm
        response = chain.invoke({"data": json.dumps(data_dict, indent=2)})
        state["exec_narrator_output"] = response.model_dump()
    except Exception as e:
        state["exec_narrator_output"] = {
            "agent": "Exec Narrator",
            "status": "failure",
            "executive_summary": f"Failed to generate summary due to LLM error: {str(e)}",
            "top_3_priorities": []
        }
    
    return state

if __name__ == "__main__":
    from models.blackboard import AgentState
    mock_state = AgentState(
        user_profile={"age": 23, "monthly_expenses_inr": 45000},
        assets={}, liabilities={}, insurance={},
        data_surgeon_output={"status": "success"},
        tax_wizard_output={"status": "success", "potential_savings": 26500},
        portfolio_xray_output={"status": "success"},
        risk_shield_output={"status": "success", "actionable": "Buy term insurance"},
        fire_planner_output={"status": "success", "freedom_number_inr": 48000000},
        exec_narrator_output=None
    )
    result = exec_narrator_node(mock_state)
    print(json.dumps(result["exec_narrator_output"], indent=2))
