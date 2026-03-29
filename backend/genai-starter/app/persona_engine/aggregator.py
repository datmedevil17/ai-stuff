"""Persona Aggregator — merges results from all 3 layers.

Deduplicates persona tags, applies confidence weighting,
and produces a final multi-persona result.
"""

from __future__ import annotations

from app.models.user import UserProfile
from app.models.persona import Persona, PersonaMatch, PersonaResult
from app.persona_engine.rule_based import apply_rules
from app.persona_engine.clustering import cluster_user
from app.persona_engine.llm_tagger import tag_personas_llm
from app.db.crud import get_all_profiles


# Confidence weight multipliers per source
SOURCE_WEIGHTS: dict[str, float] = {
    "llm": 1.0,       # Highest trust — context-aware
    "rule": 0.85,      # High trust — deterministic
    "cluster": 0.70,   # Lower trust — statistical
}


def run_persona_engine(profile: UserProfile) -> PersonaResult:
    """Run all 3 layers and aggregate into a single PersonaResult.

    1. Rule-based (always runs)
    2. K-Means clustering (runs if model available or enough data)
    3. LLM persona tagger (runs if API key configured)
    """

    # Collect matches from all layers
    all_matches: list[PersonaMatch] = []

    # Layer 1: Rules
    rule_matches = apply_rules(profile)
    all_matches.extend(rule_matches)

    # Layer 2: Clustering
    all_profiles = get_all_profiles()
    cluster_matches = cluster_user(profile, all_profiles)
    all_matches.extend(cluster_matches)

    # Layer 3: LLM
    llm_matches = tag_personas_llm(profile)
    all_matches.extend(llm_matches)

    # ── Aggregate: deduplicate by persona, keep highest weighted confidence ──
    best: dict[Persona, PersonaMatch] = {}
    for match in all_matches:
        weight = SOURCE_WEIGHTS.get(match.source, 0.5)
        weighted_conf = match.confidence * weight

        if match.persona not in best or weighted_conf > (best[match.persona].confidence * SOURCE_WEIGHTS.get(best[match.persona].source, 0.5)):
            # Keep the better-scoring match but store weighted confidence
            best[match.persona] = PersonaMatch(
                persona=match.persona,
                confidence=round(weighted_conf, 2),
                source=match.source,
                reasoning=match.reasoning,
            )

    # Sort by confidence descending
    final_matches = sorted(best.values(), key=lambda m: m.confidence, reverse=True)

    primary = final_matches[0].persona if final_matches else None

    return PersonaResult(
        user_id=profile.user_id,
        personas=final_matches,
        primary_persona=primary,
    )
