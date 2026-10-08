"""
Application settings loaded from environment variables / .env file.
"""

import re

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/trackintern"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def clean_db_url(cls, v: str) -> str:
        """Fix URL prefix and strip libpq-only params that asyncpg rejects."""
        # Fix scheme prefix
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://") and "+asyncpg" not in v:
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        # Strip params asyncpg doesn't understand
        for param in ("sslmode", "channel_binding"):
            v = re.sub(rf"[?&]{param}=[^&]*", "", v)
        v = v.rstrip("?&")
        return v

    @property
    def db_connect_args(self) -> dict:
        """Return asyncpg SSL and pooler connect_args."""
        args: dict = {}
        needs_ssl = any(
            kw in self.DATABASE_URL
            for kw in ("neon.tech", "ssl=require", "render.com", "dpg-", "supabase", "pooler")
        )
        if needs_ssl:
            args["ssl"] = True
        if "pooler" in self.DATABASE_URL or "neon.tech" in self.DATABASE_URL:
            args["prepared_statement_cache_size"] = 0
            args["statement_cache_size"] = 0
        return args

    # JWT
    SECRET_KEY: str = "change-me-to-a-random-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: str = "*"

    # File uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # Cloudinary Cloud Storage
    CLOUDINARY_CLOUD_NAME: str | None = None
    CLOUDINARY_API_KEY: str | None = None
    CLOUDINARY_API_SECRET: str | None = None
    CLOUDINARY_URL: str | None = None

    @property
    def is_cloudinary_configured(self) -> bool:
        return bool(
            self.CLOUDINARY_URL
            or (self.CLOUDINARY_CLOUD_NAME and self.CLOUDINARY_API_KEY and self.CLOUDINARY_API_SECRET)
        )

    # Email
    EMAIL_ENABLED: bool = False

    @property
    def cors_origins_list(self) -> list[str]:
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
