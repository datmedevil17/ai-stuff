import json
from langchain_core.prompts import ChatPromptTemplate
from agents.llm_runtime import get_structured_llm
from models.blackboard import AgentState
from models.agent_outputs import PortfolioXRayOutput

structured_llm = get_structured_llm(PortfolioXRayOutput)

def portfolio_xray_node(state: AgentState) -> AgentState:
    """
    Portfolio X-Ray Agent:
    Analyzes asset allocation and risk profile based on current assets and user age/personas.
    """
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are the 'Portfolio X-Ray Agent', a premier investment strategist.
Analyze the user's 'assets' and 'user_profile' (like age).
Your tasks:
1. Output the `current_allocation` exactly as percentages (e.g., {{"Equity": "56%", "Crypto": "19%", "Debt/Cash": "25%"}}). Let the keys make sense for their actual assets.
2. Formulate a `target_allocation` based on their age and personas (e.g. Aggressive, Young means high equity).
3. Provide precise, actionable `insights` (e.g., Crypto exposure is too high, Emergency fund is low relative to their expenses).

Be strict and sound highly professional."""),
        ("user", "Here is the user's current data:\n\n{data}")
    ])
    
    data_dict = {
        "user_profile": state.get("user_profile"),
        "assets": state.get("assets"),
        "liabilities": state.get("liabilities"),
        "insurance": state.get("insurance")
    }
    
    try:
        if structured_llm is None:
            raise RuntimeError("Gemini model unavailable. Set GEMINI_API_KEY to enable live analysis.")
        chain = prompt | structured_llm
        response = chain.invoke({"data": json.dumps(data_dict, indent=2)})
        state["portfolio_xray_output"] = response.model_dump()
    except Exception as e:
        state["portfolio_xray_output"] = {
            "agent": "Portfolio X-Ray",
            "status": "failure",
            "current_allocation": {},
            "target_allocation": {},
            "insights": [f"LLM parsing failed: {str(e)}"]
        }
        
    return state
