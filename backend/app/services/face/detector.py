"""
Face Detector — detects faces using modern deep learning YuNet (SCRFD) with fallback.
"""

import os
from dataclasses import dataclass
from typing import Tuple

import cv2
import numpy as np


class FaceDetectionError(Exception):
    """Base exception for face detection errors."""
    pass


class FaceNotDetectedError(FaceDetectionError):
    """Raised when no face is found in the frame."""
    pass


class MultipleFacesError(FaceDetectionError):
    """Raised when more than one face is detected."""
    pass


class FaceTooSmallError(FaceDetectionError):
    """Raised when the detected face is too small / far from camera."""
    pass


@dataclass
class DetectedFace:
    bbox: Tuple[int, int, int, int]  # (x, y, w, h)
    face_roi: np.ndarray             # Cropped BGR face image
    confidence: float
    coverage_ratio: float           # face_area / image_area
    raw_face_data: np.ndarray | None = None  # YuNet 15-dim face landmarks vector


class FaceDetector:
    """
    State-of-the-art Deep Face Detector using YuNet (SCRFD architecture).
    """

    def __init__(self, weights_dir: str | None = None):
        if weights_dir is None:
            weights_dir = os.path.join(os.path.dirname(__file__), "weights")
        self.weights_dir = weights_dir
        self.model_path = os.path.join(weights_dir, "face_detection_yunet.onnx")

        self.net = None
        if os.path.exists(self.model_path):
            try:
                self.net = cv2.FaceDetectorYN.create(
                    model=self.model_path,
                    config="",
                    input_size=(320, 320),
                    score_threshold=0.60,
                    nms_threshold=0.30,
                    top_k=10,
                )
            except Exception as e:
                print(f"[WARN] Failed to load YuNet: {e}")

    def detect_face(
        self,
        image_bgr: np.ndarray,
        min_coverage: float = 0.05,
    ) -> DetectedFace:
        """
        Detect a single face in the image.
        Raises FaceNotDetectedError, MultipleFacesError, or FaceTooSmallError.
        """
        if image_bgr is None or image_bgr.size == 0:
            raise FaceNotDetectedError("Invalid or empty image provided")

        h, w = image_bgr.shape[:2]
        total_area = h * w

        faces = []
        if self.net is not None:
            self.net.setInputSize((w, h))
            _, raw_faces = self.net.detect(image_bgr)
            if raw_faces is not None and len(raw_faces) > 0:
                faces = raw_faces

        if len(faces) == 0:
            raise FaceNotDetectedError(
                "No face detected. Please ensure your face is clearly visible and centered in the frame."
            )

        if len(faces) > 1:
            # Sort by bounding box area descending
            sorted_faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
            primary_area = sorted_faces[0][2] * sorted_faces[0][3]
            secondary_area = sorted_faces[1][2] * sorted_faces[1][3]
            if (secondary_area / primary_area) > 0.35:
                raise MultipleFacesError(
                    "Multiple faces detected. Please ensure only you are present in the camera view."
                )
            faces = [sorted_faces[0]]

        face_data = faces[0]
        x, y, fw, fh = int(face_data[0]), int(face_data[1]), int(face_data[2]), int(face_data[3])
        confidence = float(face_data[-1])

        # Clamp bounding box inside image
        x = max(0, x)
        y = max(0, y)
        fw = min(w - x, fw)
        fh = min(h - y, fh)

        face_area = fw * fh
        coverage_ratio = face_area / total_area

        if coverage_ratio < min_coverage:
            raise FaceTooSmallError(
                f"Face is too far from the camera ({coverage_ratio:.1%} coverage). Please move closer."
            )

        # 10% margin around face
        margin_x = int(fw * 0.1)
        margin_y = int(fh * 0.1)
        crop_x1 = max(0, x - margin_x)
        crop_y1 = max(0, y - margin_y)
        crop_x2 = min(w, x + fw + margin_x)
        crop_y2 = min(h, y + fh + margin_y)

        face_roi = image_bgr[crop_y1:crop_y2, crop_x1:crop_x2]

        return DetectedFace(
            bbox=(x, y, fw, fh),
            face_roi=face_roi,
            confidence=confidence,
            coverage_ratio=coverage_ratio,
            raw_face_data=face_data,
        )


detector = FaceDetector()
