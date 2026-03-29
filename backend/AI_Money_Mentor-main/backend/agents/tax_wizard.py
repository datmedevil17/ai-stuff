import json
from langchain_core.prompts import ChatPromptTemplate
from agents.llm_runtime import get_structured_llm
from models.blackboard import AgentState
from models.agent_outputs import TaxWizardOutput

structured_llm = get_structured_llm(TaxWizardOutput)

def tax_wizard_node(state: AgentState) -> AgentState:
    """
    Tax Wizard Agent:
    Completely relies on Gemini to estimate the Old Regime vs New Regime tax, 
    and identify tax-saving gaps based on the user's financial profile.
    """
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are the 'Tax Wizard', a brilliant Indian tax advisor (Chartered Accountant).
Please calculate the estimated annual income tax in India using both the Old Regime and the New Regime.
The user data contains their annual income, assets (like EPF which counts for 80C), 
insurance (health covers for 80D), and liabilities (education loan for 80E).

Follow these rules based on Indian Tax standards:
1. Standard deduction of 50,000 applies to both.
2. Calculate the exact Old Regime tax based on applicable deductions (80C, 80D). 
3. Calculate the exact New Regime tax.
4. Set potential_savings to the difference.
5. Identify any tax-saving gaps (e.g. 80C unutilised limit, missing 80CCD NPS, missing HRA).

Return the recommended regime, exact calculations, and the gaps identified."""),
        ("user", "Here is the user's data:\n\n{data}")
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
        state["tax_wizard_output"] = response.model_dump()
    except Exception as e:
        state["tax_wizard_output"] = {
            "agent": "Tax Wizard",
            "status": "failure",
            "regime_recommendation": "New Regime",
            "analysis": {"old_regime_tax": 0, "new_regime_tax": 0, "potential_savings": 0},
            "gaps": [f"LLM parsing failed: {str(e)}"]
        }
        
    return state
