"""Tests for the K-Means clustering layer."""

import pytest
from app.models.user import UserProfile
from app.persona_engine.clustering import _profile_to_features, cluster_user


def _make_profile(**kwargs) -> UserProfile:
    defaults = dict(
        user_id="test-user",
        age=30,
        annual_income=600_000,
        monthly_expenses=25_000,
        total_assets=200_000,
        total_liabilities=0,
        monthly_emi=0,
        has_life_insurance=False,
        has_health_insurance=False,
        dependents=0,
        goals=["house"],
    )
    defaults.update(kwargs)
    return UserProfile(**defaults)


class TestFeatureVector:
    def test_correct_length(self):
        profile = _make_profile()
        features = _profile_to_features(profile)
        assert len(features) == 9

    def test_values_match_profile(self):
        profile = _make_profile(age=28, annual_income=1_000_000, dependents=2)
        features = _profile_to_features(profile)
        assert features[0] == 28.0  # age
        assert features[1] == 1_000_000  # income
        assert features[8] == 2.0  # dependents


class TestClusteringFallback:
    def test_empty_returns_empty_when_no_model(self):
        """When no trained model exists and not enough users, returns empty."""
        profile = _make_profile()
        # With only 1 user (below MIN_USERS_FOR_CLUSTERING), should return empty
        result = cluster_user(profile, all_profiles=[profile])
        assert result == []
