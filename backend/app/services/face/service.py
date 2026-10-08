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

        # Decode image and transpose based on EXIF orientation to ensure face is upright
        try:
            import gc
            import io
            from PIL import Image, ImageOps
            with Image.open(io.BytesIO(image_bytes)) as pil_img:
                pil_transposed = ImageOps.exif_transpose(pil_img)
                if pil_transposed is None:
                    pil_transposed = pil_img
                if pil_transposed.mode != "RGB":
                    pil_transposed = pil_transposed.convert("RGB")
                # Downsample large phone camera photos (e.g. 4000x3000 -> max 640x640)
                # to prevent OOM crash on Render Free 512MB RAM tier
                pil_transposed.thumbnail((640, 640), Image.Resampling.BILINEAR)
                image_bgr = cv2.cvtColor(np.array(pil_transposed), cv2.COLOR_RGB2BGR)
        except Exception:
            np_arr = np.frombuffer(image_bytes, np.uint8)
            image_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if image_bgr is not None and max(image_bgr.shape[:2]) > 640:
            scale = 640.0 / max(image_bgr.shape[:2])
            new_w = int(image_bgr.shape[1] * scale)
            new_h = int(image_bgr.shape[0] * scale)
            image_bgr = cv2.resize(image_bgr, (new_w, new_h), interpolation=cv2.INTER_AREA)

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

        # Free intermediate buffers
        import gc
        gc.collect()

        return FaceEnrollmentResult(
            embedding_bytes=embedding_bytes,
            quality_score=quality.quality_score,
            liveness_score=liveness.liveness_score,
            bbox=detected.bbox,
            model_name=self.recognizer.model_name,
            model_version=self.recognizer.model_version,
        )

    def validate_face_image(self, image_bytes: bytes) -> dict:
        """
        Fast lightweight probe to check if a live capture has a detected,
        centered, well-lit, and clear face before final enrollment.
        """
        import gc
        if not image_bytes or len(image_bytes) < 100:
            return {
                "detected": False,
                "aligned": False,
                "clear": False,
                "quality_score": 0.0,
                "message": "No image data received. Please capture a photo.",
            }

        try:
            import io
            from PIL import Image, ImageOps
            with Image.open(io.BytesIO(image_bytes)) as pil_img:
                pil_transposed = ImageOps.exif_transpose(pil_img)
                if pil_transposed is None:
                    pil_transposed = pil_img
                if pil_transposed.mode != "RGB":
                    pil_transposed = pil_transposed.convert("RGB")
                pil_transposed.thumbnail((640, 640), Image.Resampling.BILINEAR)
                image_bgr = cv2.cvtColor(np.array(pil_transposed), cv2.COLOR_RGB2BGR)
        except Exception:
            np_arr = np.frombuffer(image_bytes, np.uint8)
            image_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if image_bgr is not None and max(image_bgr.shape[:2]) > 640:
            scale = 640.0 / max(image_bgr.shape[:2])
            new_w = int(image_bgr.shape[1] * scale)
            new_h = int(image_bgr.shape[0] * scale)
            image_bgr = cv2.resize(image_bgr, (new_w, new_h), interpolation=cv2.INTER_AREA)

        if image_bgr is None:
            return {
                "detected": False,
                "aligned": False,
                "clear": False,
                "quality_score": 0.0,
                "message": "Invalid or unreadable image file.",
            }

        # 1. Detection
        try:
            detected = self.detector.detect_face(image_bgr, min_coverage=0.04)
        except FaceNotDetectedError:
            gc.collect()
            return {
                "detected": False,
                "aligned": False,
                "clear": False,
                "quality_score": 0.0,
                "message": "No face detected. Please position your face inside the oval frame and look at the camera.",
            }
        except MultipleFacesError:
            gc.collect()
            return {
                "detected": False,
                "aligned": False,
                "clear": False,
                "quality_score": 0.0,
                "message": "Multiple faces detected. Please ensure only you are present in the frame.",
            }
        except FaceTooSmallError:
            gc.collect()
            return {
                "detected": True,
                "aligned": False,
                "clear": False,
                "quality_score": 0.2,
                "message": "Face is too far away. Please move closer to the camera.",
            }
        except Exception as e:
            gc.collect()
            return {
                "detected": False,
                "aligned": False,
                "clear": False,
                "quality_score": 0.0,
                "message": f"Detection error: {str(e)}",
            }

        # 2. Alignment: face should be centered in the frame
        img_h, img_w = image_bgr.shape[:2]
        fx, fy, fw, fh = detected.bbox
        cx = fx + fw / 2.0
        cy = fy + fh / 2.0

        offset_x = abs(cx - img_w / 2.0) / img_w
        offset_y = abs(cy - img_h / 2.0) / img_h

        is_aligned = offset_x <= 0.35 and offset_y <= 0.35
        if not is_aligned:
            gc.collect()
            return {
                "detected": True,
                "aligned": False,
                "clear": True,
                "quality_score": 0.5,
                "message": "Face is off-center. Please center your face inside the oval frame.",
            }

        # 3. Quality (sharpness, lighting)
        try:
            quality = self.quality_checker.evaluate(detected.face_roi)
            is_clear = True
            quality_score = quality.quality_score
            message = "Face detected, well-aligned, and clear to capture!"
        except FaceBlurryError:
            is_clear = False
            quality_score = 0.3
            message = "Photo is blurry. Please hold steady and recapture."
        except FaceLightingError as le:
            is_clear = False
            quality_score = 0.3
            message = str(le)
        except Exception as qe:
            is_clear = False
            quality_score = 0.4
            message = str(qe)

        gc.collect()
        return {
            "detected": True,
            "aligned": is_aligned,
            "clear": is_clear,
            "quality_score": quality_score,
            "message": message,
        }

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
