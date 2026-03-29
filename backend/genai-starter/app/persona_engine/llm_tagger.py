"""Layer 3 — LLM-Based Persona Tagging.

Sends the full user profile to Gemini and asks it to assign 1-3 personas
with reasoning, giving us the most nuanced / context-aware layer.
"""

from __future__ import annotations

import json

from app.llm.runtime import invoke_llm_text
from app.models.user import UserProfile
from app.models.persona import Persona, PersonaMatch

PERSONA_LIST = ", ".join([p.value for p in Persona])

TAGGING_PROMPT = """You are a financial advisor AI. Analyse the following user's financial profile and assign 1 to 3 personas from the list below.

**Available Personas:** {personas}

**User Profile:**
- Age: {age}
- Annual Income: ₹{income:,.0f}
- Monthly Expenses: ₹{expenses:,.0f}
- Expense Ratio: {expense_ratio:.0%}
- Total Assets: ₹{assets:,.0f}
- Total Liabilities: ₹{liabilities:,.0f}
- Monthly EMI: ₹{emi:,.0f}
- EMI/Income Ratio: {emi_ratio:.0%}
- Life Insurance: {life_ins} (cover: ₹{life_cover:,.0f})
- Health Insurance: {health_ins} (cover: ₹{health_cover:,.0f})
- Dependents: {dependents}
- Financial Goals: {goals}

Return ONLY a valid JSON array of objects, each with:
- "persona": one of the persona values listed above
- "confidence": 0.0 to 1.0
- "reasoning": a one-sentence explanation

Example:
[
  {{"persona": "debt_stressed", "confidence": 0.85, "reasoning": "High EMI-to-income ratio indicates debt pressure."}},
  {{"persona": "underinsured", "confidence": 0.70, "reasoning": "No life insurance despite having dependents."}}
]

IMPORTANT: Return ONLY the JSON array, no extra text.
"""


def tag_personas_llm(profile: UserProfile) -> list[PersonaMatch]:
    """Use Gemini to assign persona tags to a user profile.

    Returns empty list if LLM is unavailable.
    """
    prompt = TAGGING_PROMPT.format(
        personas=PERSONA_LIST,
        age=profile.age,
        income=profile.annual_income,
        expenses=profile.monthly_expenses,
        expense_ratio=profile.expense_ratio,
        assets=profile.total_assets,
        liabilities=profile.total_liabilities,
        emi=profile.monthly_emi,
        emi_ratio=profile.emi_to_income_ratio,
        life_ins="Yes" if profile.has_life_insurance else "No",
        life_cover=profile.life_insurance_cover,
        health_ins="Yes" if profile.has_health_insurance else "No",
        health_cover=profile.health_insurance_cover,
        dependents=profile.dependents,
        goals=", ".join(profile.goals) if profile.goals else "None specified",
    )

    text = invoke_llm_text(prompt)
    if not text:
        return []

    try:
        # Clean markdown formatting
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        raw_list = json.loads(text)

        matches: list[PersonaMatch] = []
        for item in raw_list:
            try:
                persona = Persona(item["persona"])
                matches.append(PersonaMatch(
                    persona=persona,
                    confidence=float(item.get("confidence", 0.5)),
                    source="llm",
                    reasoning=item.get("reasoning", ""),
                ))
            except (ValueError, KeyError):
                continue

        return matches

    except Exception as e:
        print(f"LLM persona tagging error: {e}")
        return []
