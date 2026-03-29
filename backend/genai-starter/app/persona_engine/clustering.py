"""Layer 2 — K-Means Clustering for Smart Segmentation.

Converts user profiles into numerical feature vectors and clusters them.
Each cluster centroid is mapped to a persona label.
"""

from __future__ import annotations

import os
import pickle
from pathlib import Path

import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from app.models.user import UserProfile
from app.models.persona import Persona, PersonaMatch
from app.config import KMEANS_N_CLUSTERS, MIN_USERS_FOR_CLUSTERING

MODEL_DIR = Path("data/models")
KMEANS_PATH = MODEL_DIR / "kmeans_model.pkl"
SCALER_PATH = MODEL_DIR / "scaler.pkl"

# Cluster → persona mapping (updated when model is retrained)
DEFAULT_CLUSTER_MAP: dict[int, Persona] = {
    0: Persona.YOUNG_INVESTOR,
    1: Persona.DEBT_STRESSED,
    2: Persona.WEALTH_BUILDER,
    3: Persona.RETIREMENT_PLANNER,
    4: Persona.CONSERVATIVE_SAVER,
    5: Persona.CASH_FLOW_TIGHT,
}


def _profile_to_features(profile: UserProfile) -> list[float]:
    """Convert a UserProfile into a numeric feature vector."""
    return [
        float(profile.age),
        profile.annual_income,
        profile.expense_ratio,
        profile.total_assets,
        profile.total_liabilities,
        float(profile.has_insurance),
        float(len(profile.goals)),
        profile.emi_to_income_ratio,
        float(profile.dependents),
    ]


def train_model(profiles: list[UserProfile]) -> tuple[KMeans, StandardScaler]:
    """Train (or retrain) K-Means on all user profiles."""
    features = np.array([_profile_to_features(p) for p in profiles])

    scaler = StandardScaler()
    scaled = scaler.fit_transform(features)

    n_clusters = min(KMEANS_N_CLUSTERS, len(profiles))
    model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    model.fit(scaled)

    # Persist
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    with open(KMEANS_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(SCALER_PATH, "wb") as f:
        pickle.dump(scaler, f)

    return model, scaler


def _load_model() -> tuple[KMeans, StandardScaler] | None:
    """Load a previously trained model from disk."""
    if not KMEANS_PATH.exists() or not SCALER_PATH.exists():
        return None
    with open(KMEANS_PATH, "rb") as f:
        model = pickle.load(f)
    with open(SCALER_PATH, "rb") as f:
        scaler = pickle.load(f)
    return model, scaler


def cluster_user(profile: UserProfile, all_profiles: list[UserProfile] | None = None) -> list[PersonaMatch]:
    """Assign a cluster-based persona to the user.

    If there are too few users for meaningful clustering, returns an empty list
    (the rule-based layer will cover it instead).
    """
    # Try to load existing model
    loaded = _load_model()

    if loaded is None:
        # Need to train — but only if enough data
        if all_profiles is None or len(all_profiles) < MIN_USERS_FOR_CLUSTERING:
            return []  # Fall back to rule-based only
        model, scaler = train_model(all_profiles)
    else:
        model, scaler = loaded

    features = np.array([_profile_to_features(profile)])
    scaled = scaler.transform(features)

    cluster_id = int(model.predict(scaled)[0])

    # Map cluster to persona
    persona = DEFAULT_CLUSTER_MAP.get(cluster_id, Persona.CONSERVATIVE_SAVER)

    # Compute distance to centroid for confidence
    centroid = model.cluster_centers_[cluster_id]
    distance = float(np.linalg.norm(scaled[0] - centroid))
    confidence = max(0.3, min(0.85, 1.0 - distance / 5.0))

    return [PersonaMatch(
        persona=persona,
        confidence=round(confidence, 2),
        source="cluster",
        reasoning=f"Assigned to cluster {cluster_id} (distance to centroid: {distance:.2f})",
    )]
