"""
Anti-Spoofing & Liveness Detection — prevents presentation attacks (photo printouts, phone screens, replays).
"""

from dataclasses import dataclass
import cv2
import numpy as np


class LivenessFailedError(Exception):
    """Raised when an anti-spoofing or presentation attack is detected."""
    pass


@dataclass
class LivenessResult:
    is_live: bool
    liveness_score: float
    frequency_score: float
    color_distribution_score: float


class LivenessDetector:
    """
    Multi-factor passive anti-spoofing detector:
    1. 2D Fourier Transform (FFT) analysis to detect LCD moire patterns and print halftone dots.
    2. YCrCb / HSV skin color chroma consistency check against screen backlight emission.
    3. Texture smoothness and reflection distribution.
    """

    def __init__(self, min_liveness_threshold: float = 0.50):
        self.min_liveness_threshold = min_liveness_threshold

    def check_liveness(self, face_roi: np.ndarray) -> LivenessResult:
        """
        Evaluate liveness on the face ROI.
        Raises LivenessFailedError if a presentation attack (static photo or screen) is detected.
        """
        if face_roi is None or face_roi.size == 0:
            raise LivenessFailedError("Empty face ROI provided for liveness check")

        # Resize to standard analysis size for consistent spatial frequency analysis
        standard_face = cv2.resize(face_roi, (160, 160))
        gray = cv2.cvtColor(standard_face, cv2.COLOR_BGR2GRAY)

        # -------------------------------------------------------------
        # Factor 1: 2D FFT Frequency Analysis
        # -------------------------------------------------------------
        # Screens and printed photos exhibit periodic high-frequency energy spikes (pixel grid moire)
        f_transform = np.fft.fft2(gray)
        f_shift = np.fft.fftshift(f_transform)
        magnitude_spectrum = np.log(np.abs(f_shift) + 1.0)

        # Measure high-frequency vs low-frequency energy ratio
        center_y, center_x = standard_face.shape[0] // 2, standard_face.shape[1] // 2
        radius = 25
        y, x = np.ogrid[:standard_face.shape[0], :standard_face.shape[1]]
        mask_low = (x - center_x) ** 2 + (y - center_y) ** 2 <= radius ** 2

        low_freq_energy = np.sum(magnitude_spectrum[mask_low])
        high_freq_energy = np.sum(magnitude_spectrum[~mask_low])
        total_energy = low_freq_energy + high_freq_energy

        ratio = high_freq_energy / (total_energy + 1e-6)
        # Live human faces typically have balanced ratio (0.50 - 0.78)
        # Screens with severe moire or flat printouts show extreme ratios
        if 0.45 <= ratio <= 0.82:
            freq_score = 1.0
        else:
            freq_score = max(0.1, 1.0 - abs(ratio - 0.65) * 3.0)

        # -------------------------------------------------------------
        # Factor 2: Color Space Chroma Distribution (YCrCb)
        # -------------------------------------------------------------
        ycrcb = cv2.cvtColor(standard_face, cv2.COLOR_BGR2YCrCb)
        cr = ycrcb[:, :, 1]
        cb = ycrcb[:, :, 2]

        # Natural human skin has distinct cluster in Cr (133-173) and Cb (77-127)
        skin_mask = (cr >= 130) & (cr <= 178) & (cb >= 75) & (cb <= 130)
        skin_ratio = np.count_nonzero(skin_mask) / float(standard_face.shape[0] * standard_face.shape[1])

        # A real face centered in frame should have at least 25% skin chroma
        # (Screens often shift blue/cyan, b/w prints have no chroma)
        if skin_ratio >= 0.25:
            color_score = min(1.0, skin_ratio / 0.55)
        else:
            color_score = skin_ratio / 0.25

        # -------------------------------------------------------------
        # Factor 3: Texture & Micro-gradients
        # -------------------------------------------------------------
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        grad_mag = np.sqrt(sobelx**2 + sobely**2)
        grad_std = float(np.std(grad_mag))
        texture_score = min(1.0, max(0.1, grad_std / 35.0))

        # Composite liveness score
        composite_score = round(
            0.40 * freq_score + 0.40 * color_score + 0.20 * texture_score,
            3,
        )

        is_live = composite_score >= self.min_liveness_threshold

        if not is_live:
            raise LivenessFailedError(
                "Liveness detection failed. The system suspected a static photograph or digital screen display. Please capture your real, physical face in live view."
            )

        return LivenessResult(
            is_live=is_live,
            liveness_score=composite_score,
            frequency_score=round(freq_score, 3),
            color_distribution_score=round(color_score, 3),
        )


liveness_detector = LivenessDetector()
