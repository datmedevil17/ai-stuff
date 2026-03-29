"""CRUD helpers for reading / writing user profiles and persona records."""

from __future__ import annotations

import json
from app.db.database import SessionLocal, UserProfileDB, PersonaRecordDB
from app.models.user import UserProfile
from app.models.persona import PersonaResult, PersonaMatch, Persona


# ── User Profile ─────────────────────────────────────────────────────

def upsert_profile(profile: UserProfile) -> None:
    """Insert or update a user profile in the DB."""
    with SessionLocal() as session:
        row = session.query(UserProfileDB).filter_by(user_id=profile.user_id).first()
        if row is None:
            row = UserProfileDB(user_id=profile.user_id)
            session.add(row)

        row.age = profile.age
        row.annual_income = profile.annual_income
        row.monthly_expenses = profile.monthly_expenses
        row.total_assets = profile.total_assets
        row.total_liabilities = profile.total_liabilities
        row.monthly_emi = profile.monthly_emi
        row.has_life_insurance = profile.has_life_insurance
        row.has_health_insurance = profile.has_health_insurance
        row.life_insurance_cover = profile.life_insurance_cover
        row.health_insurance_cover = profile.health_insurance_cover
        row.dependents = profile.dependents
        row.goals = profile.goals
        row.sources = profile.sources
        session.commit()


def get_profile(user_id: str) -> UserProfile | None:
    """Load a user profile from the DB, or None if not found."""
    with SessionLocal() as session:
        row = session.query(UserProfileDB).filter_by(user_id=user_id).first()
        if row is None:
            return None
        return UserProfile(
            user_id=row.user_id,
            age=row.age,
            annual_income=row.annual_income,
            monthly_expenses=row.monthly_expenses,
            total_assets=row.total_assets,
            total_liabilities=row.total_liabilities,
            monthly_emi=row.monthly_emi,
            has_life_insurance=row.has_life_insurance,
            has_health_insurance=row.has_health_insurance,
            life_insurance_cover=row.life_insurance_cover,
            health_insurance_cover=row.health_insurance_cover,
            dependents=row.dependents,
            goals=row.goals,
            sources=row.sources,
        )


def get_all_profiles() -> list[UserProfile]:
    """Return every user profile (used for clustering)."""
    with SessionLocal() as session:
        rows = session.query(UserProfileDB).all()
        return [
            UserProfile(
                user_id=r.user_id,
                age=r.age,
                annual_income=r.annual_income,
                monthly_expenses=r.monthly_expenses,
                total_assets=r.total_assets,
                total_liabilities=r.total_liabilities,
                monthly_emi=r.monthly_emi,
                has_life_insurance=r.has_life_insurance,
                has_health_insurance=r.has_health_insurance,
                life_insurance_cover=r.life_insurance_cover,
                health_insurance_cover=r.health_insurance_cover,
                dependents=r.dependents,
                goals=r.goals,
                sources=r.sources,
            )
            for r in rows
        ]


# ── Persona Records ─────────────────────────────────────────────────

def save_persona_result(result: PersonaResult) -> None:
    """Persist persona assignment."""
    with SessionLocal() as session:
        record = PersonaRecordDB(
            user_id=result.user_id,
            personas_json=json.dumps([m.model_dump() for m in result.personas]),
        )
        session.add(record)
        session.commit()


def get_latest_persona(user_id: str) -> PersonaResult | None:
    """Fetch the most recent persona assignment for a user."""
    with SessionLocal() as session:
        row = (
            session.query(PersonaRecordDB)
            .filter_by(user_id=user_id)
            .order_by(PersonaRecordDB.created_at.desc())
            .first()
        )
        if row is None:
            return None
        matches_raw = json.loads(row.personas_json)
        matches = [PersonaMatch(**m) for m in matches_raw]
        primary = matches[0].persona if matches else None
        return PersonaResult(user_id=user_id, personas=matches, primary_persona=primary)
