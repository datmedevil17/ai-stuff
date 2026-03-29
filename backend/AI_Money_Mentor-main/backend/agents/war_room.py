from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional, Any
from models.blackboard import AgentState

from agents.data_surgeon import data_surgeon_node
from agents.tax_wizard import tax_wizard_node
from agents.portfolio_xray import portfolio_xray_node
from agents.risk_shield import risk_shield_node
from agents.fire_planner import fire_planner_node
from agents.exec_narrator import exec_narrator_node

# Build the graph using the shared AgentState
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("data_surgeon", data_surgeon_node)
workflow.add_node("tax_wizard", tax_wizard_node)
workflow.add_node("portfolio_xray", portfolio_xray_node)
workflow.add_node("risk_shield", risk_shield_node)
workflow.add_node("fire_planner", fire_planner_node)
workflow.add_node("exec_narrator", exec_narrator_node)

# Define edges sequentially
workflow.add_edge("data_surgeon", "tax_wizard")
workflow.add_edge("tax_wizard", "portfolio_xray")
workflow.add_edge("portfolio_xray", "risk_shield")
workflow.add_edge("risk_shield", "fire_planner")
workflow.add_edge("fire_planner", "exec_narrator")
workflow.add_edge("exec_narrator", END)

workflow.set_entry_point("data_surgeon")

app_chain = workflow.compile()
