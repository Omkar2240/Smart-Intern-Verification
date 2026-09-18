"""
College ID Card Verifier — validates uploaded document image and checks against student profile and selected college.
"""

import io
import re
from dataclasses import dataclass
from typing import Optional

from PIL import Image

from app.models.college import College
from app.models.user import User
from app.services.document.ocr import ocr_service, ExtractedDocumentData


@dataclass
class DocumentVerificationResult:
    status: str  # "verified" | "manual_review" | "rejected"
    extracted_fields: dict
    match_score: float
    review_notes: Optional[str] = None
    rejection_reason: Optional[str] = None


class CollegeIdVerifier:
    """
    Validates uploaded college ID cards and matches against user registration and selected college.
    """

    ALLOWED_MIME_TYPES = {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    }

    def __init__(self):
        self.ocr = ocr_service

    def verify_document(
        self,
        image_bytes: bytes,
        content_type: str,
        user: User,
        college: College,
    ) -> DocumentVerificationResult:
        """
        Verify an uploaded college ID card.
        """
        # 1. MIME type validation
        if content_type.lower() not in self.ALLOWED_MIME_TYPES:
            return DocumentVerificationResult(
                status="rejected",
                extracted_fields={},
                match_score=0.0,
                rejection_reason=f"Unsupported file type '{content_type}'. Allowed: JPEG, PNG, WebP.",
            )

        # 2. File size & image decode validation
        if len(image_bytes) < 1024:  # Less than 1 KB is too small to be a card
            return DocumentVerificationResult(
                status="rejected",
                extracted_fields={},
                match_score=0.0,
                rejection_reason="File is too small or corrupted.",
            )

        try:
            pil_img = Image.open(io.BytesIO(image_bytes))
            width, height = pil_img.size
        except Exception:
            return DocumentVerificationResult(
                status="rejected",
                extracted_fields={},
                match_score=0.0,
                rejection_reason="Uploaded file is not a valid image.",
            )

        # Minimum resolution check (e.g. 200 x 150)
        if width < 150 or height < 150:
            return DocumentVerificationResult(
                status="rejected",
                extracted_fields={"dimensions": f"{width}x{height}"},
                match_score=0.0,
                rejection_reason="Image resolution is too low for document verification.",
            )

        # 3. Extract text via OCR
        extracted: ExtractedDocumentData = self.ocr.extract_text(image_bytes)
        raw_text_lower = extracted.raw_text.lower()

        # 4. Compare with Selected College
        # Extract college keywords (words with length >= 4)
        college_keywords = [
            w.lower()
            for w in re.findall(r"\b[A-Za-z]{4,}\b", college.name)
            if w.lower() not in ("college", "institute", "engineering", "university")
        ]
        # Include code/acronym if available (e.g. "GHRCEN")
        if college.code:
            college_keywords.append(college.code.lower())

        college_matched = False
        college_match_count = 0
        for kw in college_keywords:
            if kw in raw_text_lower:
                college_matched = True
                college_match_count += 1

        # 5. Compare with User Name & Registration Number
        user_name_parts = [
            part.lower()
            for part in re.findall(r"\b[A-Za-z]{3,}\b", user.name)
        ]
        name_matched = False
        name_match_count = 0
        for part in user_name_parts:
            if part in raw_text_lower:
                name_matched = True
                name_match_count += 1

        reg_matched = False
        if user.registration_number and user.registration_number.lower() in raw_text_lower:
            reg_matched = True

        # Compute match score
        match_score = 0.0
        if college_matched:
            match_score += 0.50
        if name_matched:
            match_score += 0.35
        if reg_matched:
            match_score += 0.15

        extracted_summary = {
            "detected_college": extracted.detected_college,
            "detected_name": extracted.detected_name,
            "detected_roll_number": extracted.detected_roll_number,
            "ocr_confidence": extracted.ocr_confidence,
            "college_matched": college_matched,
            "name_matched": name_matched,
        }

        # 6. Status Determination
        # If OCR returned empty or very short text (e.g. Tesseract binary not on host or blurry card),
        # route to manual_review instead of auto-accepting or hard rejecting!
        if len(raw_text_lower.strip()) < 15:
            return DocumentVerificationResult(
                status="manual_review",
                extracted_fields=extracted_summary,
                match_score=0.40,
                review_notes="Automated OCR text could not be clearly resolved. Card forwarded to administrative manual review.",
            )

        if match_score >= 0.70:
            return DocumentVerificationResult(
                status="verified",
                extracted_fields=extracted_summary,
                match_score=match_score,
            )
        elif match_score >= 0.35:
            return DocumentVerificationResult(
                status="manual_review",
                extracted_fields=extracted_summary,
                match_score=match_score,
                review_notes="Partial match found between college ID card and profile details. Forwarded for administrative review.",
            )
        else:
            return DocumentVerificationResult(
                status="rejected",
                extracted_fields=extracted_summary,
                match_score=match_score,
                rejection_reason="The uploaded ID card does not appear to match the selected college or your registered name.",
            )


college_id_verifier = CollegeIdVerifier()
