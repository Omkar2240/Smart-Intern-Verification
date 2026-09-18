"""
Face recognition, detection, quality assurance, and liveness package.
"""

from app.services.face.service import (
    FaceVerificationService,
    FaceError,
    FaceNotDetectedError,
    MultipleFacesError,
    FaceTooSmallError,
    FaceBlurryError,
    FaceLightingError,
    LivenessFailedError,
    face_service,
)

__all__ = [
    "FaceVerificationService",
    "FaceError",
    "FaceNotDetectedError",
    "MultipleFacesError",
    "FaceTooSmallError",
    "FaceBlurryError",
    "FaceLightingError",
    "LivenessFailedError",
    "face_service",
]
