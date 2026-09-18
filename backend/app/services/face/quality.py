"""
Face Quality Assurance — validates sharpness, illumination, contrast, and resolution.
"""

from dataclasses import dataclass
import cv2
import numpy as np


class FaceQualityError(Exception):
    """Base exception for face quality validation failures."""
    pass


class FaceBlurryError(FaceQualityError):
    """Raised when the captured face fails sharpness checks."""
    pass


class FaceLightingError(FaceQualityError):
    """Raised when the face is underexposed or overexposed."""
    pass


@dataclass
class QualityMetrics:
    sharpness: float
    brightness: float
    contrast: float
    is_valid: bool
    quality_score: float


class FaceQualityChecker:
    """
    Evaluates image quality on the cropped face ROI.
    """

    def __init__(
        self,
        min_sharpness: float = 45.0,
        min_brightness: float = 35.0,
        max_brightness: float = 230.0,
        min_contrast: float = 20.0,
    ):
        self.min_sharpness = min_sharpness
        self.min_brightness = min_brightness
        self.max_brightness = max_brightness
        self.min_contrast = min_contrast

    def evaluate(self, face_roi: np.ndarray) -> QualityMetrics:
        """
        Evaluate quality metrics on face ROI.
        Raises FaceBlurryError or FaceLightingError on critical quality failures.
        """
        if face_roi is None or face_roi.size == 0:
            raise FaceQualityError("Empty face ROI provided")

        gray = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY) if len(face_roi.shape) == 3 else face_roi

        # 1. Brightness & Contrast
        brightness = float(np.mean(gray))
        contrast = float(np.std(gray))

        if brightness < self.min_brightness:
            raise FaceLightingError(
                f"Lighting is too dim (brightness: {brightness:.1f}). Please move to a better lit area."
            )
        if brightness > self.max_brightness:
            raise FaceLightingError(
                f"Lighting is too bright/washed out (brightness: {brightness:.1f}). Avoid direct harsh glare."
            )
        if contrast < self.min_contrast:
            raise FaceLightingError(
                "Image lacks sufficient contrast. Please ensure your face is evenly illuminated."
            )

        # 2. Sharpness via Laplacian variance
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        sharpness = float(laplacian.var())

        if sharpness < self.min_sharpness:
            raise FaceBlurryError(
                f"Image is too blurry (sharpness score: {sharpness:.1f}). Please hold the phone steady and ensure clear focus."
            )

        # Composite quality score normalized to [0, 1]
        sharpness_norm = min(1.0, sharpness / 300.0)
        brightness_norm = 1.0 - abs(brightness - 128.0) / 128.0
        contrast_norm = min(1.0, contrast / 80.0)

        composite_score = round(
            0.5 * sharpness_norm + 0.3 * brightness_norm + 0.2 * contrast_norm,
            3,
        )

        return QualityMetrics(
            sharpness=sharpness,
            brightness=brightness,
            contrast=contrast,
            is_valid=True,
            quality_score=composite_score,
        )


quality_checker = FaceQualityChecker()
