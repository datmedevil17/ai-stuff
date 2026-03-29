import json
from langchain_core.prompts import ChatPromptTemplate
from agents.llm_runtime import get_structured_llm
from models.blackboard import AgentState
from models.agent_outputs import DataSurgeonOutput

structured_llm = get_structured_llm(DataSurgeonOutput)

def data_surgeon_node(state: AgentState) -> AgentState:
    """
    Data Surgeon Agent:
    Scans the input for missing anomalies or data. Analyzes user_profile, assets, liabilities, and insurance.
    Returns a score and flags for potential issues.
    """
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are the 'Data Surgeon', an expert AI financial data auditor. 
Your job is to analyze the user's financial data to ensure it is logical and complete.
Check for anomalies like:
- Extremely high expenses compared to income
- Missing typical data (like 0 EPF for a salaried person, or 0 bank balance)
- Inconsistencies between age and assets
You must output a Data Quality Score out of 100, and generate specific warning or info flags.
Set verified to true unless the data is totally unintelligible or 100% missing."""),
        ("user", "Here is the user's data:\n\n{data}")
    ])
    
    # Format incoming data into a string
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
        # convert the pydantic model to a dict for exactly what frontend expects
        state["data_surgeon_output"] = response.model_dump()
    except Exception as e:
        # Fallback if LLM fails
        state["data_surgeon_output"] = {
            "agent": "Data Surgeon",
            "status": "failure",
            "data_quality_score": 0,
            "flags": [{"type": "error", "message": f"LLM parsing failed: {str(e)}"}],
            "verified": False
        }
    
    return state
