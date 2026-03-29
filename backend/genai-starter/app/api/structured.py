"""API: Structured data ingestion endpoint."""

from __future__ import annotations

import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.user import StructuredInput, UserProfile
from app.db.crud import upsert_profile, get_profile

router = APIRouter(prefix="/ingest", tags=["Ingestion"])


class StructuredResponse(BaseModel):
    user_id: str
    message: str
    sources: list[str]


@router.post("/structured", response_model=StructuredResponse)
def ingest_structured(data: StructuredInput, user_id: str | None = None):
    """Ingest structured financial data from the form.

    If user_id is provided, merges with existing profile. Otherwise creates a new user.
    """
    uid = user_id or str(uuid.uuid4())

    # Load or create profile
    profile = get_profile(uid) or UserProfile(user_id=uid)
    profile.merge_from_structured(data)
    upsert_profile(profile)

    return StructuredResponse(
        user_id=uid,
        message="Structured data ingested successfully",
        sources=profile.sources,
    )
