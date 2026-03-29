"""LLM-based data extraction and metadata tagging.

Takes raw text (from PDFs, chat, etc.) and calls Gemini to extract
structured financial fields with proper metadata.
"""

from __future__ import annotations

import json
from app.llm.runtime import invoke_llm_text

EXTRACTION_PROMPT = """You are a financial data extraction specialist. Given the following raw text from a financial document or user query, extract ALL relevant financial information into a structured JSON object.

**Raw Text:**
{text}

**Source Type:** {source_type}

Return ONLY a valid JSON object with these fields (use null for fields you cannot determine):

{{
  "age": <int or null>,
  "annual_income": <float or null>,
  "monthly_expenses": <float or null>,
  "mutual_funds": <float or null — total MF portfolio value>,
  "stocks": <float or null — total stock portfolio value>,
  "fixed_deposits": <float or null>,
  "home_loan": <float or null>,
  "car_loan": <float or null>,
  "personal_loan": <float or null>,
  "monthly_emi": <float or null>,
  "has_life_insurance": <bool or null>,
  "has_health_insurance": <bool or null>,
  "life_insurance_cover": <float or null>,
  "health_insurance_cover": <float or null>,
  "dependents": <int or null>,
  "goals": <list of strings like ["retirement", "house"] or null>,
  "total_assets": <float or null — sum of all assets if extractable>,
  "total_liabilities": <float or null — sum of all liabilities if extractable>,
  "metadata": {{
    "document_type": "<CAMS|bank_statement|form16|chat_query|other>",
    "confidence": <0.0 to 1.0 — your confidence in the extraction>,
    "key_findings": ["<brief finding 1>", "<brief finding 2>"],
    "time_period": "<if applicable, e.g. FY 2024-25>"
  }}
}}

IMPORTANT: Return ONLY the JSON object, no markdown formatting, no extra text.
"""


def extract_financial_data(raw_text: str, source_type: str = "other") -> dict:
    """Call Gemini to extract structured financial data from raw text.

    Args:
        raw_text: The text to analyse (from PDF, chat, etc.)
        source_type: One of 'cams_pdf', 'bank_statement', 'form16', 'chat_query', 'other'

    Returns:
        Dict with extracted financial fields + metadata.
    """
    prompt = EXTRACTION_PROMPT.format(text=raw_text[:8000], source_type=source_type)

    text = invoke_llm_text(prompt)
    if not text:
        return _fallback_extraction(raw_text, source_type)

    try:
        # Clean up potential markdown wrapping
        if text.startswith("```"):
            text = text.split("\n", 1)[1]  # Remove first line
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        result = json.loads(text)
        # Remove None values
        return {k: v for k, v in result.items() if v is not None}

    except Exception as e:
        print(f"LLM extraction error: {e}")
        return _fallback_extraction(raw_text, source_type)


def _fallback_extraction(raw_text: str, source_type: str) -> dict:
    """Basic keyword-based extraction when LLM is unavailable."""
    result: dict = {
        "metadata": {
            "document_type": source_type,
            "confidence": 0.2,
            "key_findings": ["LLM unavailable — used fallback keyword extraction"],
        }
    }

    text_lower = raw_text.lower()

    # Goal detection from keywords
    goal_keywords = {
        "retirement": "retirement",
        "retire": "retirement",
        "house": "house",
        "home": "house",
        "education": "education",
        "travel": "travel",
        "wedding": "wedding",
        "car": "car",
        "emergency": "emergency_fund",
    }
    goals = []
    for keyword, goal in goal_keywords.items():
        if keyword in text_lower and goal not in goals:
            goals.append(goal)
    if goals:
        result["goals"] = goals

    return result


def merge_extracted_to_profile_dict(extracted: dict) -> dict:
    """Convert LLM extraction output to a dict suitable for UserProfile.merge_extracted().

    Removes the metadata key and flattens asset/liability fields.
    """
    profile_fields: dict = {}

    direct_fields = [
        "age", "annual_income", "monthly_expenses", "monthly_emi",
        "has_life_insurance", "has_health_insurance",
        "life_insurance_cover", "health_insurance_cover",
        "dependents", "goals", "total_assets", "total_liabilities",
    ]

    for f in direct_fields:
        if f in extracted:
            profile_fields[f] = extracted[f]

    # Sum individual asset fields into total_assets if not already set
    if "total_assets" not in profile_fields:
        asset_sum = sum(
            extracted.get(k, 0) or 0
            for k in ["mutual_funds", "stocks", "fixed_deposits"]
        )
        if asset_sum > 0:
            profile_fields["total_assets"] = asset_sum

    # Sum individual liability fields into total_liabilities if not already set
    if "total_liabilities" not in profile_fields:
        liability_sum = sum(
            extracted.get(k, 0) or 0
            for k in ["home_loan", "car_loan", "personal_loan"]
        )
        if liability_sum > 0:
            profile_fields["total_liabilities"] = liability_sum

    return profile_fields
