"""Recommendation Engine — maps personas to actionable financial recommendations.

Each persona has a curated set of recommendations. For a user with multiple
personas, recommendations from all active personas are merged and deduplicated.
"""

from __future__ import annotations

from app.models.persona import Persona, PersonaResult
from app.models.recommendation import Recommendation, RecommendationResult


# ── Persona → Recommendation Catalogue ──────────────────────────────

RECOMMENDATION_CATALOGUE: dict[Persona, list[dict]] = {
    Persona.YOUNG_INVESTOR: [
        {"title": "Start a SIP in Index Funds", "description": "Begin with ₹5,000/month in a Nifty 50 index fund. At your age, compounding will do the heavy lifting.", "category": "investment", "priority": 1},
        {"title": "Build an Emergency Fund", "description": "Save 6 months of expenses in a liquid fund or high-yield savings account before taking on risk.", "category": "savings", "priority": 2},
        {"title": "Get Term Life Insurance Early", "description": "Term insurance premiums are cheapest when you're young. A ₹1Cr cover costs ~₹8,000/year at age 25.", "category": "insurance", "priority": 2},
        {"title": "Avoid Lifestyle Inflation", "description": "As income grows, maintain your current expense ratio and invest the difference.", "category": "budgeting", "priority": 3},
    ],
    Persona.DEBT_STRESSED: [
        {"title": "Prioritise High-Interest Debt", "description": "Pay off credit cards and personal loans first (16-40% interest) before making new investments.", "category": "debt", "priority": 1},
        {"title": "Consider Debt Consolidation", "description": "If you have multiple loans, consolidate into a single lower-rate loan to reduce EMI burden.", "category": "debt", "priority": 1},
        {"title": "50/30/20 Budget Rule", "description": "Allocate 50% to needs, 30% to debt repayment, 20% to savings. Adjust as EMI reduces.", "category": "budgeting", "priority": 2},
        {"title": "Negotiate Your Loan Rates", "description": "Call your bank and ask for rate reduction. Many banks offer 0.25-0.50% reduction on request.", "category": "debt", "priority": 3},
    ],
    Persona.WEALTH_BUILDER: [
        {"title": "Diversify Across Asset Classes", "description": "Ensure your portfolio spans equity, debt, gold, and REITs. No single asset class should exceed 50%.", "category": "investment", "priority": 1},
        {"title": "Tax Harvesting", "description": "Book long-term capital gains up to ₹1.25L/year tax-free by selling and reinvesting equity.", "category": "tax", "priority": 2},
        {"title": "Consider Direct Mutual Funds", "description": "Switch from regular to direct MF plans to save 0.5-1.5% in annual commissions.", "category": "investment", "priority": 2},
        {"title": "Estate Planning", "description": "Create a will and nominate beneficiaries on all financial accounts.", "category": "planning", "priority": 3},
    ],
    Persona.RETIREMENT_PLANNER: [
        {"title": "Calculate Your Retirement Corpus", "description": "Use the 25× rule: annual expenses × 25 = your target corpus (adjusted for inflation).", "category": "planning", "priority": 1},
        {"title": "Maximise NPS Contributions", "description": "Get additional ₹50,000 tax deduction under Section 80CCD(1B) by investing in NPS.", "category": "tax", "priority": 1},
        {"title": "Shift to Balanced Funds", "description": "As retirement nears, gradually move from pure equity to balanced advantage funds.", "category": "investment", "priority": 2},
        {"title": "Health Insurance Top-Up", "description": "Medical expenses rise with age. Add a super top-up policy for ₹25-50L additional cover.", "category": "insurance", "priority": 2},
    ],
    Persona.UNDERINSURED: [
        {"title": "Get Term Life Insurance Immediately", "description": "Cover should be 10-15× your annual income. This is non-negotiable if you have dependents.", "category": "insurance", "priority": 1},
        {"title": "Health Insurance Coverage Gap", "description": "Ensure family floater cover of at least ₹10L. Add a super top-up for ₹25-50L.", "category": "insurance", "priority": 1},
        {"title": "Critical Illness Rider", "description": "Add a critical illness rider to your term plan for coverage against cancer, heart disease, etc.", "category": "insurance", "priority": 2},
        {"title": "Review Existing Policies", "description": "Cancel any ULIPs or endowment plans and redirect premiums to term + mutual funds.", "category": "insurance", "priority": 3},
    ],
    Persona.CASH_FLOW_TIGHT: [
        {"title": "Track Every Expense for 30 Days", "description": "Use an app to categorise all spending. Most people find 15-20% of expenses are unnecessary.", "category": "budgeting", "priority": 1},
        {"title": "Cut Subscription Leakage", "description": "Audit all recurring subscriptions (OTT, gym, apps). Cancel anything unused in 30 days.", "category": "budgeting", "priority": 2},
        {"title": "Automate Savings First", "description": "Set up auto-transfer of 10% of salary to a separate account on payday, before spending.", "category": "savings", "priority": 2},
        {"title": "Find Additional Income Streams", "description": "Consider freelancing, tutoring, or monetising a skill to supplement primary income.", "category": "income", "priority": 3},
    ],
    Persona.CONSERVATIVE_SAVER: [
        {"title": "Introduce Equity Gradually", "description": "At least 20-30% of your portfolio should be in equity for long-term wealth creation. Start with large-cap funds.", "category": "investment", "priority": 1},
        {"title": "Ladder Your Fixed Deposits", "description": "Instead of one big FD, split across 1, 2, 3, 5 year tenures for liquidity + better rates.", "category": "investment", "priority": 2},
        {"title": "Inflation-Proof Your Savings", "description": "FDs at 7% with inflation at 6% give only 1% real return. Equity historically gives 4-5% real returns.", "category": "investment", "priority": 2},
        {"title": "Goal-Based Investing", "description": "Map each goal to a specific instrument — equity for long-term, debt for short-term goals.", "category": "planning", "priority": 3},
    ],
    Persona.AGGRESSIVE_INVESTOR: [
        {"title": "Rebalance Quarterly", "description": "High equity portfolios need regular rebalancing. Sell winners and buy laggards to maintain target allocation.", "category": "investment", "priority": 1},
        {"title": "Don't Ignore Debt Components", "description": "Even aggressive portfolios need 20-30% in debt/bonds as a buffer against volatility.", "category": "investment", "priority": 2},
        {"title": "Explore International Diversification", "description": "Add 10-15% exposure to US/global markets via Nasdaq fund or international ETFs.", "category": "investment", "priority": 2},
        {"title": "Set Stop-Loss Discipline", "description": "For direct stock picks, maintain strict stop-losses at 15-20% to protect capital.", "category": "investment", "priority": 3},
    ],
}


def generate_recommendations(persona_result: PersonaResult) -> RecommendationResult:
    """Generate aggregated recommendations across all assigned personas.

    Recommendations are deduplicated by title and sorted by priority.
    """
    seen_titles: set[str] = set()
    all_recs: list[Recommendation] = []

    for match in persona_result.personas:
        catalogue = RECOMMENDATION_CATALOGUE.get(match.persona, [])
        for rec_data in catalogue:
            if rec_data["title"] not in seen_titles:
                seen_titles.add(rec_data["title"])
                all_recs.append(Recommendation(
                    title=rec_data["title"],
                    description=rec_data["description"],
                    category=rec_data["category"],
                    priority=rec_data["priority"],
                    source_persona=match.persona,
                ))

    # Sort: priority ascending (1 = most important), then alphabetically
    all_recs.sort(key=lambda r: (r.priority, r.title))

    return RecommendationResult(
        user_id=persona_result.user_id,
        recommendations=all_recs,
        persona_names=persona_result.persona_names(),
    )
