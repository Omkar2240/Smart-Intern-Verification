"""
OCR & Document Text Extraction Service.
"""

import io
import re
from dataclasses import dataclass
from typing import Optional

from PIL import Image


@dataclass
class ExtractedDocumentData:
    raw_text: str
    detected_college: Optional[str]
    detected_name: Optional[str]
    detected_roll_number: Optional[str]
    ocr_confidence: float


class DocumentParser:
    """
    Parses OCR text into structured identity attributes.
    """

    COLLEGE_KEYWORDS = [
        "college",
        "institute",
        "university",
        "technology",
        "engineering",
        "polytechnic",
        "vidyalaya",
        "raisoni",
        "ghrcen",
    ]

    ROLL_PATTERNS = [
        r"(?:roll\s*(?:no|number)?|id\s*(?:no|number)?|reg\s*(?:no|number)?|enrol(?:lment)?\s*(?:no)?)\s*[:.\-]?\s*([a-zA-Z0-9\-_/]{4,20})",
        r"\b([A-Z0-9]{2,6}[0-9]{4,10})\b",
    ]

    NAME_PATTERNS = [
        r"(?:name|student\s*name)\s*[:.\-]?\s*([a-zA-Z\s.]{3,40})",
    ]

    @classmethod
    def parse(cls, text: str) -> ExtractedDocumentData:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        detected_college = None
        detected_name = None
        detected_roll = None

        # Search for College Name
        for line in lines:
            line_lower = line.lower()
            if any(kw in line_lower for kw in cls.COLLEGE_KEYWORDS):
                detected_college = line
                break

        # Search for Name
        for line in lines:
            for pat in cls.NAME_PATTERNS:
                match = re.search(pat, line, re.IGNORECASE)
                if match:
                    candidate = match.group(1).strip()
                    if len(candidate) > 2 and not any(kw in candidate.lower() for kw in cls.COLLEGE_KEYWORDS):
                        detected_name = candidate
                        break
            if detected_name:
                break

        # If name label not found, look for candidate capitalized words
        if not detected_name and len(lines) >= 2:
            for line in lines[1:5]:
                if line != detected_college and re.match(r"^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$", line):
                    detected_name = line
                    break

        # Search for Roll / ID number
        for line in lines:
            for pat in cls.ROLL_PATTERNS:
                match = re.search(pat, line, re.IGNORECASE)
                if match:
                    detected_roll = match.group(1).strip()
                    break
            if detected_roll:
                break

        # Approximate OCR quality/confidence based on text density and keyword presence
        confidence = 0.5
        if detected_college:
            confidence += 0.25
        if detected_name:
            confidence += 0.15
        if detected_roll:
            confidence += 0.10

        return ExtractedDocumentData(
            raw_text=text,
            detected_college=detected_college,
            detected_name=detected_name,
            detected_roll_number=detected_roll,
            ocr_confidence=min(1.0, confidence),
        )


class OCRService:
    """
    Extracts text from images using PyTesseract with fallback parser.
    """

    def __init__(self):
        self.parser = DocumentParser()

    def extract_text(self, image_bytes: bytes) -> ExtractedDocumentData:
        """
        Extract text and parse fields from document image bytes.
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            # Convert to RGB if needed
            if image.mode not in ("RGB", "L"):
                image = image.convert("RGB")
        except Exception as e:
            raise ValueError(f"Invalid image format: {e}")

        # Attempt extraction via pytesseract
        raw_text = ""
        try:
            import pytesseract
            raw_text = pytesseract.image_to_string(image)
        except Exception:
            # Pytesseract binary not found or failed on system
            # Fall back to empty raw text, which will safely trigger manual_review
            raw_text = ""

        return self.parser.parse(raw_text)


ocr_service = OCRService()
