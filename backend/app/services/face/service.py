"""
Face Verification Service — high-level coordinator of detection, quality checks, anti-spoofing, and embedding generation.
"""

from dataclasses import dataclass
from typing import Tuple

import cv2
import numpy as np

from app.services.face.detector import (
    FaceDetectionError,
    FaceNotDetectedError,
    MultipleFacesError,
    FaceTooSmallError,
    detector,
)
from app.services.face.quality import (
    FaceQualityError,
    FaceBlurryError,
    FaceLightingError,
    quality_checker,
)
from app.services.face.liveness import (
    LivenessFailedError,
    liveness_detector,
)
from app.services.face.recognizer import recognizer


class FaceError(Exception):
    """Base class for face service errors."""
    pass


@dataclass
class FaceEnrollmentResult:
    embedding_bytes: bytes
    quality_score: float
    liveness_score: float
    bbox: Tuple[int, int, int, int]
    model_name: str
    model_version: str


class FaceVerificationService:
    """
    Coordinates face enrollment and verification pipeline.
    """

    def __init__(self):
        self.detector = detector
        self.quality_checker = quality_checker
        self.liveness_detector = liveness_detector
        self.recognizer = recognizer

    def process_face_image(self, image_bytes: bytes) -> FaceEnrollmentResult:
        """
        Process a captured face image through the verification pipeline:
        1. Decode image
        2. Detect single face
        3. Quality checks (blur, lighting, contrast)
        4. Anti-spoofing / liveness validation
        5. ArcFace 512-dim embedding generation
        """
        if not image_bytes or len(image_bytes) < 100:
            raise FaceError("Captured image is empty or corrupted")

        # Decode image from buffer
        np_arr = np.frombuffer(image_bytes, np.uint8)
        image_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if image_bgr is None:
            raise FaceError("Unable to decode image file. Please provide a valid JPG or PNG image.")

        # 1. Detection & bounds check
        detected = self.detector.detect_face(image_bgr)

        # 2. Quality validation
        quality = self.quality_checker.evaluate(detected.face_roi)

        # 3. Anti-spoofing / liveness check
        liveness = self.liveness_detector.check_liveness(detected.face_roi)

        # 4. Feature embedding extraction
        embedding = self.recognizer.extract_embedding(detected.face_roi)
        embedding_bytes = self.recognizer.embedding_to_bytes(embedding)

        return FaceEnrollmentResult(
            embedding_bytes=embedding_bytes,
            quality_score=quality.quality_score,
            liveness_score=liveness.liveness_score,
            bbox=detected.bbox,
            model_name=self.recognizer.model_name,
            model_version=self.recognizer.model_version,
        )

    def verify_against_stored(
        self,
        image_bytes: bytes,
        enrolled_embedding: bytes,
        threshold: float = 0.68,
    ) -> Tuple[bool, float]:
        """
        Verify live face against enrolled face embedding (used for attendance).
        """
        result = self.process_face_image(image_bytes)
        return self.recognizer.is_match(
            result.embedding_bytes,
            enrolled_embedding,
            threshold=threshold,
        )


face_service = FaceVerificationService()
