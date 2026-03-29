"""Integration test: full pipeline from structured input to persona + recommendations."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestFullPipeline:
    def test_structured_ingest_and_analyse(self):
        """Ingest structured data → get personas → get recommendations."""

        # Step 1: Ingest
        payload = {
            "age": 28,
            "annual_income": 800000,
            "monthly_expenses": 30000,
            "mutual_funds": 200000,
            "stocks": 100000,
            "fixed_deposits": 50000,
            "other_assets": 0,
            "home_loan": 0,
            "car_loan": 0,
            "personal_loan": 0,
            "monthly_emi": 0,
            "has_life_insurance": False,
            "has_health_insurance": False,
            "life_insurance_cover": 0,
            "health_insurance_cover": 0,
            "dependents": 0,
            "goals": ["house", "retirement"],
        }

        res = client.post("/ingest/structured", json=payload)
        assert res.status_code == 200
        data = res.json()
        user_id = data["user_id"]
        assert user_id

        # Step 2: Get profile
        res = client.get(f"/profile/{user_id}")
        assert res.status_code == 200
        profile = res.json()
        assert profile["age"] == 28
        assert profile["total_assets"] == 350000  # MF + stocks + FD

        # Step 3: Get personas + recommendations
        res = client.get(f"/personas/{user_id}")
        assert res.status_code == 200
        result = res.json()

        assert len(result["personas"]) > 0
        assert len(result["recommendations"]) > 0
        assert len(result["persona_names"]) > 0

        # This profile should match YOUNG_INVESTOR (age 28, income, no dependents)
        persona_types = [p["persona"] for p in result["personas"]]
        assert "young_investor" in persona_types

    def test_chat_ingest(self):
        """Test chat-based ingestion creates / updates profile."""
        payload = {
            "message": "I am 35 years old and earn 15 LPA. I want to retire early.",
        }

        res = client.post("/ingest/chat", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["user_id"]

    def test_unknown_user_404(self):
        """Requesting persona for non-existent user returns 404."""
        res = client.get("/personas/nonexistent-user-xyz")
        assert res.status_code == 404
