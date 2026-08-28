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
}

EXTENSION_MAP = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
}


class LocalStorage:
    """
    Stores files on the local filesystem.
    Replace this class with an S3Storage / R2Storage / GCSStorage class
    when ready to deploy to the cloud — just match the interface.
    """

    def __init__(self, base_dir: str | None = None):
        self.base_dir = base_dir or settings.UPLOAD_DIR

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
        if content_type not in ALLOWED_CONTENT_TYPES:
            raise ValueError(
                f"Unsupported file type: {content_type}. "
                f"Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}"
            )

        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(file_content) > max_bytes:
            raise ValueError(
                f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE_MB} MB"
            )

        ext = EXTENSION_MAP.get(content_type, "")
        filename = f"{uuid.uuid4().hex}{ext}"
        rel_path = os.path.join(subdirectory, filename)
        abs_path = os.path.join(self.base_dir, rel_path)

        os.makedirs(os.path.dirname(abs_path), exist_ok=True)

        async with aiofiles.open(abs_path, "wb") as f:
            await f.write(file_content)

        return rel_path

    def get_abs_path(self, storage_ref: str) -> str:
        """Resolve a storage reference to an absolute filesystem path."""
        return os.path.join(self.base_dir, storage_ref)
