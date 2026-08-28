# 🗄️ TrackIntern — Database Management & Neon DB Migration Guide

This guide explains how to view, access, and query your current local PostgreSQL database, and how to seamlessly switch to **Neon Cloud PostgreSQL** in the future.

---

## 🔍 Part 1: How to View & Access the Local Database

Your local PostgreSQL database is running on port **`5432`**.

### Method 1: Using a Free Database GUI Tool (Recommended)

Connect with any PostgreSQL GUI client (such as **DBeaver**, **TablePlus**, **pgAdmin 4**, or the **VS Code "Database Client"** extension):

| Parameter | Value |
|---|---|
| **Host** | `localhost` or `127.0.0.1` |
| **Port** | `5432` |
| **Database Name** | `trackintern` |
| **Username** | `postgres` |
| **Password** | `postgres` |
| **SSL Mode** | `disable` (for local development) |

---

### Method 2: Command Line (`psql` inside container)

You can run SQL queries directly from your terminal using `psql`:

```bash
# If using Podman:
wsl -d podman-machine-default -u root podman exec -it trackintern-pg psql -U postgres -d trackintern

# If using Docker:
docker exec -it trackintern-pg psql -U postgres -d trackintern
```

#### Handy SQL Queries:

```sql
-- 1. List all tables
\dt

-- 2. View all registered users (passwords are safely hashed with Argon2id)
SELECT id, name, email, registration_number, mobile_number, is_active, is_verified, created_at 
FROM users;

-- 3. View active refresh token sessions
SELECT id, user_id, expires_at, revoked_at, created_at 
FROM refresh_tokens;

-- 4. View student academic profiles
SELECT id, user_id, college, branch, roll_number, college_id_path 
FROM student_profiles;

-- 5. View email verification & password reset tokens
SELECT id, user_id, token_type, expires_at, used_at 
FROM verification_tokens;

-- 6. Exit psql
\q
```

---

## ☁️ Part 2: Switching to Neon DB (Cloud PostgreSQL)

[Neon](https://neon.tech) is a serverless, autoscaling PostgreSQL cloud database. You can migrate to Neon in **less than 2 minutes** with **zero code modifications**.

### Step 1: Create a Database on Neon
1. Go to [neon.tech](https://neon.tech) and sign in.
2. Create a new project (e.g. `trackintern`).
3. Under **Connection Details**, copy your connection string:
   ```text
   postgresql://omkar_owner:AbCdEf123@ep-xyz-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

---

### Step 2: Update `backend/.env`
1. Open `backend/.env`.
2. Update `DATABASE_URL` with your Neon string, changing the prefix from `postgresql://` to `postgresql+asyncpg://`:

```env
# Neon Cloud Database
DATABASE_URL=postgresql+asyncpg://omkar_owner:AbCdEf123@ep-xyz-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

### Step 3: Run Database Migrations on Neon
In the `backend` directory, run:

```bash
uv run alembic upgrade head
```

> **What this does:** Alembic automatically connects to Neon DB and creates all tables, foreign keys, and indexes matching your SQLAlchemy models.

---

### Step 4: Restart the FastAPI Backend Server
```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🔒 Security Best Practices for Cloud Databases

1. **Never commit `.env` to Git**: Ensure `.env` is listed in your `.gitignore`.
2. **Connection Pooling**: Neon provides pooled connection strings (`-pooler` in host name), which are recommended for serverless deployments.
3. **SSL Enforcement**: Always keep `?sslmode=require` in cloud connection strings.
