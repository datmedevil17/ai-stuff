"""LangGraph Financial War Room — 6 Agents Workflow.

A stateful multi-agent system that runs in a graph.
Agents: DataSurgeon, TaxWizard, PortfolioXRay, RiskShield, FIREPlanner, ExecNarrator.
"""

from __future__ import annotations

import operator
from typing import Annotated, TypedDict, List, Dict, Optional

from langgraph.graph import StateGraph, END

from app.llm.runtime import invoke_llm_text
from app.models.user import UserProfile
from app.models.persona import Persona, PersonaMatch


# ── State Definition ────────────────────────────────────────────────

class AgentState(TypedDict):
    """The 'Blackboard' where all agents write their findings."""
    profile: UserProfile
    data_report: Optional[str]
    tax_report: Optional[str]
    portfolio_report: Optional[str]
    risk_report: Optional[str]
    fire_report: Optional[str]
    final_synthesis: Optional[str]
    agent_logs: Annotated[List[str], operator.add]  # Appends logs
    personas: Annotated[List[PersonaMatch], operator.add]


# ── Agent Helpers ──────────────────────────────────────────────────

def call_gemini(prompt: str) -> str:
    response = invoke_llm_text(prompt)
    if response:
        return response
    return "LLM UNAVAILABLE — FALLBACK MODE"


# ── Agent 1: The Data Surgeon ──────────────────────────────────────

def data_surgeon_node(state: AgentState) -> Dict:
    p = state["profile"]
    prompt = f"""You are the DATA SURGEON. Clean and structure this user's raw financial data.
    Input: {p.model_dump_json()}
    Identity: {p.user_id}

    1. Identify any data gaps (e.g., missing income, missing age).
    2. Confirm if we have bank statements or CAMS documents.
    3. Return a 'Data Quality Score' (1-10) and a cleaned JSON of current metrics.
    """
    report = call_gemini(prompt)
    return {
        "data_report": report,
        "agent_logs": ["Agent 'Data Surgeon' cleaned the profile and calculated quality score."]
    }

# ── Agent 2: The Tax Wizard ─────────────────────────────────────────

def tax_wizard_node(state: AgentState) -> Dict:
    p = state["profile"]
    prompt = f"""You are the TAX WIZARD (India Specialised).
    Current Annual Income: ₹{p.annual_income:,.0f}
    Deductions Found: {p.life_insurance_cover + p.health_insurance_cover}

    Task:
    1. Estimate tax liability for Old vs New Regime (FY 24-25).
    2. Identify 80C and 80D gaps.
    3. Suggest immediate tax-saving moves (ELSS, NPS, Health Insurance).
    4. Flag any missed HRA or LTA opportunities.
    """
    report = call_gemini(prompt)
    
    # Add persona if tax efficiency is low
    matches = []
    if p.annual_income > 10_000_000:
        matches.append(PersonaMatch(persona=Persona.WEALTH_BUILDER, confidence=0.7, source="tax_agent", reasoning="High net worth individual flagged by Tax Wizard."))
    
    return {
        "tax_report": report,
        "agent_logs": ["Agent 'Tax Wizard' calculated 80C gaps and Old vs New regime efficiency."],
        "personas": matches
    }

# ── Agent 3: The Portfolio X-Ray ───────────────────────────────────

def portfolio_xray_node(state: AgentState) -> Dict:
    p = state["profile"]
    prompt = f"""You are the PORTFOLIO X-RAY.
    Current Assets: ₹{p.total_assets:,.0f}
    Goals: {p.goals}

    Task:
    1. Evaluate current asset allocation (Equity vs Debt vs Liquid).
    2. If goals like 'retirement' or 'house' exist, is the current corpus enough?
    3. Suggest a rebalancing plan based on Indian market conditions.
    """
    report = call_gemini(prompt)
    return {
        "portfolio_report": report,
        "agent_logs": ["Agent 'Portfolio X-Ray' analyzed asset allocation and rebalancing needs."]
    }

# ── Agent 4: The Risk & Debt Shield ────────────────────────────────

def risk_shield_node(state: AgentState) -> Dict:
    p = state["profile"]
    prompt = f"""You are the RISK & DEBT SHIELD.
    Monthly Income: ₹{p.annual_income/12:,.0f}
    Monthly EMI: ₹{p.monthly_emi:,.0f}
    Dependents: {p.dependents}
    Insurance: {p.has_life_insurance} (Term) / {p.has_health_insurance} (Health)

    Task:
    1. Calculate EMI-to-Income Ratio.
    2. Calculate Human Life Value (HLV) for Life Insurance needs.
    3. Identify critical health insurance gaps.
    4. Flag 'Debt Stress' if EMI ratio > 40%.
    """
    report = call_gemini(prompt)
    
    matches = []
    if p.monthly_emi / (p.annual_income/12 or 1) > 0.4:
        matches.append(PersonaMatch(persona=Persona.DEBT_STRESSED, confidence=0.9, source="risk_agent", reasoning="High EMI ratio flagged by Risk Shield."))

    return {
        "risk_report": report,
        "agent_logs": ["Agent 'Risk Shield' calculated debt-to-income and insurance gaps."],
        "personas": matches
    }

# ── Agent 5: The FIRE Path Planner ────────────────────────────────

def fire_planner_node(state: AgentState) -> Dict:
    p = state["profile"]
    prompt = f"""You are the FIRE PATH PLANNER (India).
    Age: {p.age} | Expenses: ₹{p.monthly_expenses:,.0f}/m
    Inflation: 6% | Target Return: 12% | Goal: Retirement (FIRE)

    Task:
    1. Calculate the 'Freedom Number' (Corpus needed for FIRE).
    2. How many years until FIRE at current savings rate?
    3. Generate a 'Month-by-Month' SIP increase roadmap.
    """
    report = call_gemini(prompt)
    return {
        "fire_report": report,
        "agent_logs": ["Agent 'FIRE Path Planner' mapped the retirement journey and Freedom Number."]
    }

# ── Agent 6: The Executive Narrator ────────────────────────────────

def exec_narrator_node(state: AgentState) -> Dict:
    reports = {
        "data": state["data_report"],
        "tax": state["tax_report"],
        "portfolio": state["portfolio_report"],
        "risk": state["risk_report"],
        "fire": state["fire_report"]
    }
    prompt = f"""You are the CHIEF EXECUTIVE NARRATOR. Synthesize these 5 agent reports into a ONE-PAGE 'Gold Strategy'.
    
    Reports: {reports}

    Task:
    1. Summarize the 'Top 3 Priorities' immediately.
    2. Write a professional Executive Summary (Hinglish tone, friendly but firm).
    3. Final 'Money Health Score' out of 100.
    """
    synthesis = call_gemini(prompt)
    return {
        "final_synthesis": synthesis,
        "agent_logs": ["Agent 'Exec Narrator' synthesized all findings into a final strategy."]
    }


# ── Graph Construction ─────────────────────────────────────────────

def create_war_room_graph():
    """Build the LangGraph workflow."""
    workflow = StateGraph(AgentState)

    # Add Nodes
    workflow.add_node("surgeon", data_surgeon_node)
    workflow.add_node("tax", tax_wizard_node)
    workflow.add_node("portfolio", portfolio_xray_node)
    workflow.add_node("risk", risk_shield_node)
    workflow.add_node("fire", fire_planner_node)
    workflow.add_node("narrator", exec_narrator_node)

    # Define Flow (Sequential/Parallel)
    workflow.set_entry_point("surgeon")

    # Surgeon starts, others run in sequence then feed to Narrator
    workflow.add_edge("surgeon", "tax")
    workflow.add_edge("tax", "portfolio")
    workflow.add_edge("portfolio", "risk")
    workflow.add_edge("risk", "fire")
    workflow.add_edge("fire", "narrator")
    workflow.add_edge("narrator", END)

    return workflow.compile()


# ── Execution Entry Point ──────────────────────────────────────────

def run_war_room(profile: UserProfile, existing_personas: list[PersonaMatch] = None):
    graph = create_war_room_graph()
    initial_state = {
        "profile": profile,
        "data_report": None,
        "tax_report": None,
        "portfolio_report": None,
        "risk_report": None,
        "fire_report": None,
        "final_synthesis": None,
        "agent_logs": [],
        "personas": existing_personas or []
    }
    
    final_output = graph.invoke(initial_state)
    return final_output
