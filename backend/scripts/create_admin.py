"""
CLI utility to create or update an administrator account.
Usage:
    uv run python -m scripts.create_admin --email admin@trackintern.com --password Admin@123456 --role super_admin
"""

import argparse
import asyncio
import sys

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.user import User


async def create_or_update_admin(
    email: str = "admin@trackintern.com",
    password: str = "Admin@123456",
    name: str = "Super Administrator",
    role: str = "super_admin",
    reg_no: str = "ADMIN001",
    mobile: str = "9999999999",
):
    async with AsyncSessionLocal() as session:
        # Check if user with this email exists
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user:
            print(f"User with email '{email}' already exists. Upgrading to role '{role}'...")
            user.role = role
            user.is_verified = True
            user.is_active = True
            user.password_hash = hash_password(password)
            await session.commit()
            print(f"Successfully updated user '{email}' as '{role}'.")
            print(f"Login Credentials:")
            print(f"  Email:    {email}")
            print(f"  Password: {password}")
            return

        # Check if registration_number or mobile exists
        reg_check = (await session.execute(select(User).where(User.registration_number == reg_no))).scalar_one_or_none()
        if reg_check:
            reg_no = f"ADMIN_{email.split('@')[0][:6]}"

        mobile_check = (await session.execute(select(User).where(User.mobile_number == mobile))).scalar_one_or_none()
        if mobile_check:
            mobile = f"99{abs(hash(email)) % 100000000:08d}"

        new_admin = User(
            name=name,
            email=email,
            registration_number=reg_no,
            mobile_number=mobile,
            password_hash=hash_password(password),
            is_active=True,
            is_verified=True,
            role=role,
        )
        session.add(new_admin)
        await session.commit()
        await session.refresh(new_admin)

        print("=" * 60)
        print("  ADMINISTRATOR ACCOUNT CREATED SUCCESSFULLY")
        print("=" * 60)
        print(f"  Email:    {new_admin.email}")
        print(f"  Password: {password}")
        print(f"  Role:     {new_admin.role}")
        print(f"  Name:     {new_admin.name}")
        print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="Create or promote an administrator user")
    parser.add_argument("--email", default="admin@trackintern.com", help="Admin email address")
    parser.add_argument("--password", default="Admin@123456", help="Admin password")
    parser.add_argument("--name", default="Super Administrator", help="Admin display name")
    parser.add_argument("--role", default="super_admin", choices=["super_admin", "college_admin"], help="Admin role")
    args = parser.parse_args()

    try:
        asyncio.run(
            create_or_update_admin(
                email=args.email,
                password=args.password,
                name=args.name,
                role=args.role,
            )
        )
    except Exception as e:
        print(f"Error creating admin: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
