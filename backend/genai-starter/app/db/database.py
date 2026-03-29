"""Database setup — SQLAlchemy async engine + session factory.

Uses SQLite for development. Switch DATABASE_URL for Postgres in production.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, Text, DateTime, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import DATABASE_URL

# Use sync engine for simplicity in this MVP
_sync_url = DATABASE_URL.replace("+aiosqlite", "")
engine = create_engine(_sync_url, connect_args={"check_same_thread": False}, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class UserProfileDB(Base):
    """Persistent user profile row."""

    __tablename__ = "user_profiles"

    user_id = Column(String, primary_key=True, index=True)
    age = Column(Integer, default=0)
    annual_income = Column(Float, default=0)
    monthly_expenses = Column(Float, default=0)
    total_assets = Column(Float, default=0)
    total_liabilities = Column(Float, default=0)
    monthly_emi = Column(Float, default=0)
    has_life_insurance = Column(Boolean, default=False)
    has_health_insurance = Column(Boolean, default=False)
    life_insurance_cover = Column(Float, default=0)
    health_insurance_cover = Column(Float, default=0)
    dependents = Column(Integer, default=0)
    goals_json = Column(Text, default="[]")
    sources_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    @property
    def goals(self) -> list[str]:
        return json.loads(self.goals_json) if self.goals_json else []

    @goals.setter
    def goals(self, value: list[str]) -> None:
        self.goals_json = json.dumps(value)

    @property
    def sources(self) -> list[str]:
        return json.loads(self.sources_json) if self.sources_json else []

    @sources.setter
    def sources(self, value: list[str]) -> None:
        self.sources_json = json.dumps(value)


class PersonaRecordDB(Base):
    """Stores the latest persona assignment for a user."""

    __tablename__ = "persona_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, index=True)
    personas_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def init_db() -> None:
    """Create all tables if they don't exist yet."""
    Base.metadata.create_all(bind=engine)
