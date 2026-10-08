"""
Local filesystem storage — abstract interface for easy swap to S3/R2/GCS.
"""

import os
import uuid

import aiofiles

from app.core.config import settings

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
}

EXTENSION_MAP = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
}


class LocalStorage:
    """
    Stores files on the local filesystem.
    Replace this class with an S3Storage / R2Storage / GCSStorage class
    when ready to deploy to the cloud — just match the interface.
    """

    def __init__(self, base_dir: str | None = None):
        if base_dir:
            self.base_dir = os.path.abspath(base_dir)
        elif os.path.isabs(settings.UPLOAD_DIR):
            self.base_dir = settings.UPLOAD_DIR
        else:
            # Check candidate upload locations: backend/uploads or uploads relative to cwd or module
            module_dir = os.path.dirname(os.path.abspath(__file__))
            backend_pkg_uploads = os.path.abspath(os.path.join(module_dir, "..", "..", "uploads"))
            cwd_uploads = os.path.abspath(settings.UPLOAD_DIR)
            cwd_backend_uploads = os.path.abspath(os.path.join(os.getcwd(), "backend", "uploads"))

            if os.path.exists(backend_pkg_uploads):
                self.base_dir = backend_pkg_uploads
            elif os.path.exists(cwd_backend_uploads):
                self.base_dir = cwd_backend_uploads
            elif os.path.exists(cwd_uploads):
                self.base_dir = cwd_uploads
            else:
                self.base_dir = backend_pkg_uploads

    async def save_file(
        self,
        file_content: bytes,
        content_type: str,
        subdirectory: str = "college_ids",
    ) -> str:
        """
        Save file to local storage.
        Returns a storage reference (relative path) for database storage.
        """
        normalized_ct = content_type.lower().split(";")[0].strip()
        if normalized_ct not in ALLOWED_CONTENT_TYPES:
            raise ValueError(
                f"Unsupported file type: {content_type}. "
                f"Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}"
            )

        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(file_content) > max_bytes:
            raise ValueError(
                f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE_MB} MB"
            )

        ext = EXTENSION_MAP.get(normalized_ct, ".jpg")
        filename = f"{uuid.uuid4().hex}{ext}"
        # Store with forward slash for cross-platform portability in DB
        rel_path = f"{subdirectory}/{filename}"
        abs_path = os.path.join(self.base_dir, subdirectory, filename)

        os.makedirs(os.path.dirname(abs_path), exist_ok=True)

        async with aiofiles.open(abs_path, "wb") as f:
            await f.write(file_content)

        return rel_path

    def get_abs_path(self, storage_ref: str) -> str:
        """Resolve a storage reference to an absolute filesystem path, searching known roots."""
        if not storage_ref:
            return ""

        if os.path.isabs(storage_ref) and os.path.exists(storage_ref):
            return storage_ref

        # Clean storage_ref
        clean_ref = storage_ref.replace("\\", "/").strip().lstrip("/")
        if clean_ref.startswith("uploads/"):
            clean_ref = clean_ref[len("uploads/") :]

        # Normalized path for local OS
        os_ref = clean_ref.replace("/", os.sep)

        candidate_dirs = [
            self.base_dir,
            os.path.abspath(settings.UPLOAD_DIR),
            os.path.abspath(os.path.join(os.getcwd(), "backend", "uploads")),
            os.path.abspath(os.path.join(os.getcwd(), "uploads")),
            os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "uploads")),
        ]

        for base in candidate_dirs:
            p = os.path.join(base, os_ref)
            if os.path.exists(p):
                return p

        # Fallback to direct join on base_dir even if not currently existing
        return os.path.join(self.base_dir, os_ref)
