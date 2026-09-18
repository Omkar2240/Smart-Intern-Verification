"""
Unit tests for Computer Vision and Biometrics services (detection, quality, liveness, recognition).
"""

import cv2
import numpy as np
import pytest

from app.services.face.detector import (
    FaceDetector,
    FaceNotDetectedError,
)
from app.services.face.quality import (
    FaceQualityChecker,
    FaceBlurryError,
    FaceLightingError,
)
from app.services.face.liveness import (
    LivenessDetector,
    LivenessFailedError,
)
from app.services.face.recognizer import (
    FaceRecognizer,
)


def test_face_detector_rejects_empty():
    detector = FaceDetector()
    with pytest.raises(FaceNotDetectedError):
        detector.detect_face(np.zeros((10, 10, 3), dtype=np.uint8))


def test_face_quality_sharpness_and_lighting():
    checker = FaceQualityChecker(min_sharpness=30.0, min_brightness=20.0, max_brightness=240.0)

    # Completely black image should fail lighting
    black_img = np.zeros((100, 100, 3), dtype=np.uint8)
    with pytest.raises(FaceLightingError):
        checker.evaluate(black_img)

    # A smooth gradient image with good contrast (std=43) and smooth variation (laplacian=1.8) fails sharpness
    x = np.linspace(-3, 3, 100)
    X, _ = np.meshgrid(x, x)
    smooth = (128 + 60 * np.sin(X)).astype(np.uint8)
    blurry_img = cv2.merge([smooth, smooth, smooth])
    with pytest.raises(FaceBlurryError):
        checker.evaluate(blurry_img)

    # Image with sharp features and balanced lighting should pass
    rng = np.random.default_rng(42)
    textured = rng.integers(30, 220, (120, 120, 3), dtype=np.uint8)
    metrics = checker.evaluate(textured)
    assert metrics.is_valid is True
    assert metrics.sharpness > 30.0
    assert 0.0 <= metrics.quality_score <= 1.0


def test_face_recognizer_embedding_and_similarity():
    recognizer = FaceRecognizer()

    # Generate two different mock face crops
    rng = np.random.default_rng(123)
    face_a = rng.integers(60, 200, (112, 112, 3), dtype=np.uint8)
    face_b = rng.integers(60, 200, (112, 112, 3), dtype=np.uint8)

    emb_a = recognizer.extract_embedding(face_a)
    emb_b = recognizer.extract_embedding(face_b)

    # Dimension must be 512
    assert emb_a.shape == (512,)
    assert emb_a.dtype == np.float32

    # L2 norm must be 1.0 (unit hypersphere)
    norm = np.linalg.norm(emb_a)
    assert abs(norm - 1.0) < 1e-4

    # Serialization to bytes and back
    raw_bytes = recognizer.embedding_to_bytes(emb_a)
    assert len(raw_bytes) == 512 * 4  # 2048 bytes
    recovered = recognizer.bytes_to_embedding(raw_bytes)
    assert np.allclose(emb_a, recovered)

    # Self similarity should be 1.0
    self_sim = recognizer.compute_similarity(emb_a, emb_a)
    assert abs(self_sim - 1.0) < 1e-4

    is_same, score = recognizer.is_match(emb_a, emb_a)
    assert is_same is True
    assert score >= 0.99
