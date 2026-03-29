"""API: Document upload endpoint (PDF ingestion)."""

from __future__ import annotations

import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from app.models.user import UserProfile
from app.ingestion.pdf_parser import parse_pdf
from app.ingestion.llm_extractor import extract_financial_data, merge_extracted_to_profile_dict
from app.db.crud import upsert_profile, get_profile

router = APIRouter(prefix="/ingest", tags=["Ingestion"])


class DocumentResponse(BaseModel):
    user_id: str
    message: str
    pages_parsed: int
    extracted_fields: dict
    sources: list[str]


@router.post("/document", response_model=DocumentResponse)
async def ingest_document(
    file: UploadFile = File(...),
    user_id: str = Form(default=""),
    source_type: str = Form(default="other"),
):
    """Upload a PDF (CAMS, bank statement, Form 16) for LLM extraction.

    The PDF is parsed for text, then the LLM extracts structured financial
    fields with metadata. Only the extracted fields are stored (not the raw PDF).
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    uid = user_id or str(uuid.uuid4())

    # 1. Parse PDF
    contents = await file.read()
    parsed = parse_pdf(contents, filename=file.filename)

    if not parsed.full_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from the PDF")

    # 2. LLM extraction
    extracted = extract_financial_data(parsed.full_text, source_type=source_type)

    # 3. Merge into profile
    profile = get_profile(uid) or UserProfile(user_id=uid)
    profile_fields = merge_extracted_to_profile_dict(extracted)
    profile.merge_extracted(profile_fields, source_name=f"pdf:{file.filename}")
    upsert_profile(profile)

    return DocumentResponse(
        user_id=uid,
        message=f"Document '{file.filename}' processed successfully ({parsed.total_pages} pages)",
        pages_parsed=parsed.total_pages,
        extracted_fields=extracted,
        sources=profile.sources,
    )
