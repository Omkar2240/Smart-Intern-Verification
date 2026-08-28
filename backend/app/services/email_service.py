"""
Mock email service — logs tokens to console in development.
Replace with SMTP / SendGrid / SES in production.
"""

import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_verification_email(email: str, token: str) -> None:
    """Send email verification link. In dev mode, just logs the token."""
    if settings.EMAIL_ENABLED:
        # TODO: integrate real email provider (SendGrid, SES, etc.)
        raise NotImplementedError("Real email sending not yet implemented")
    else:
        logger.info(
            "📧 [DEV] Email verification token for %s: %s",
            email,
            token,
        )


async def send_password_reset_email(email: str, token: str) -> None:
    """Send password reset link. In dev mode, just logs the token."""
    if settings.EMAIL_ENABLED:
        raise NotImplementedError("Real email sending not yet implemented")
    else:
        logger.info(
            "📧 [DEV] Password reset token for %s: %s",
            email,
            token,
        )
