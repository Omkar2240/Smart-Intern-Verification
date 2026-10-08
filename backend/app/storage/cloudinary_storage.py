"""
Cloudinary storage provider for permanent cloud asset hosting.
"""

import asyncio
import logging
import os
import uuid
import cloudinary
import cloudinary.uploader

from app.core.config import settings
from app.storage.local import LocalStorage, ALLOWED_CONTENT_TYPES, EXTENSION_MAP

logger = logging.getLogger(__name__)


class CloudinaryStorage:
    """
    Uploads images and documents to Cloudinary.
    Falls back gracefully to LocalStorage if Cloudinary credentials are not configured.
    """

    def __init__(self):
        self._local = LocalStorage()
        self._setup_cloudinary()

    def _setup_cloudinary(self):
        if settings.CLOUDINARY_URL:
            cloudinary.config(cloudinary_url=settings.CLOUDINARY_URL, secure=True)
            logger.info("Cloudinary storage configured via CLOUDINARY_URL")
        elif (
            settings.CLOUDINARY_CLOUD_NAME
            and settings.CLOUDINARY_API_KEY
            and settings.CLOUDINARY_API_SECRET
        ):
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True,
            )
            logger.info("Cloudinary storage configured via CLOUDINARY_CLOUD_NAME")

    @property
    def is_configured(self) -> bool:
        return settings.is_cloudinary_configured

    async def save_file(
        self,
        file_content: bytes,
        content_type: str,
        subdirectory: str = "college_ids",
    ) -> str:
        """
        Saves file to Cloudinary (or local storage if Cloudinary is not configured).
        Returns a permanent public URL (Cloudinary secure_url) or relative path (local).
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

        # Re-check in case settings were reloaded
        if not self.is_configured:
            logger.warning(
                "Cloudinary is not configured (missing CLOUDINARY_CLOUD_NAME/API_KEY or CLOUDINARY_URL). "
                "Falling back to local disk storage."
            )
            return await self._local.save_file(file_content, content_type, subdirectory)

        # Upload to Cloudinary in a threadpool so async loop is not blocked
        def _sync_upload():
            folder_name = f"smart_intern/{subdirectory}"
            res = cloudinary.uploader.upload(
                file_content,
                folder=folder_name,
                resource_type="auto",
                overwrite=True,
                unique_filename=True,
            )
            return res

        try:
            loop = asyncio.get_running_loop()
            upload_res = await loop.run_in_executor(None, _sync_upload)
            secure_url = upload_res.get("secure_url") or upload_res.get("url")
            if not secure_url:
                raise ValueError("Cloudinary upload failed: no secure_url returned")
            logger.info("Uploaded file to Cloudinary successfully: %s", secure_url)
            return secure_url
        except Exception as e:
            logger.error("Cloudinary upload failed with error: %s. Falling back to local storage.", e)
            return await self._local.save_file(file_content, content_type, subdirectory)

    def get_abs_path(self, storage_ref: str) -> str:
        """Resolve a storage reference."""
        if not storage_ref:
            return ""
        if storage_ref.startswith(("http://", "https://")):
            return storage_ref
        return self._local.get_abs_path(storage_ref)
