"""API: Chat-based data ingestion endpoint."""

from __future__ import annotations

import uuid
from fastapi import APIRouter
from pydantic import BaseModel

from app.models.user import UserProfile
from app.ingestion.llm_extractor import extract_financial_data, merge_extracted_to_profile_dict
from app.db.crud import upsert_profile, get_profile

router = APIRouter(prefix="/ingest", tags=["Ingestion"])


class ChatRequest(BaseModel):
    message: str
    user_id: str | None = None


class ChatResponse(BaseModel):
    user_id: str
    message: str
    extracted_fields: dict
    sources: list[str]


@router.post("/chat", response_model=ChatResponse)
def ingest_chat(req: ChatRequest):
    """Process a free-text chat query for financial intent / data extraction.

    Examples:
        "I want to retire by 50"
        "I have 2 kids and no insurance"
        "My salary is 12 LPA and I spend 40k per month"
    """
    uid = req.user_id or str(uuid.uuid4())

    # LLM extraction from chat text
    extracted = extract_financial_data(req.message, source_type="chat_query")

    # Merge into profile
    profile = get_profile(uid) or UserProfile(user_id=uid)
    profile_fields = merge_extracted_to_profile_dict(extracted)
    profile.merge_extracted(profile_fields, source_name="chat_query")
    upsert_profile(profile)

    return ChatResponse(
        user_id=uid,
        message="Chat data processed and merged into your profile",
        extracted_fields=extracted,
        sources=profile.sources,
    )
