"""PDF text extraction using pdfplumber.

Supports CAMS/KFintech statements, bank statements, and Form 16.
"""

from __future__ import annotations

import io
from dataclasses import dataclass, field
import pdfplumber


@dataclass
class ParsedPage:
    page_number: int
    text: str


@dataclass
class ParsedDocument:
    filename: str
    pages: list[ParsedPage] = field(default_factory=list)
    total_pages: int = 0

    @property
    def full_text(self) -> str:
        return "\n\n".join(p.text for p in self.pages)


def parse_pdf(file_bytes: bytes, filename: str = "upload.pdf") -> ParsedDocument:
    """Extract text from every page of a PDF.

    Args:
        file_bytes: Raw PDF bytes (from an upload or file read).
        filename: Original filename for metadata.

    Returns:
        ParsedDocument with per-page text.
    """
    pages: list[ParsedPage] = []

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            # Also try extracting tables and appending as text
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    if row:
                        text += "\n" + " | ".join(str(cell) if cell else "" for cell in row)
            pages.append(ParsedPage(page_number=i, text=text.strip()))

    return ParsedDocument(filename=filename, pages=pages, total_pages=len(pages))
