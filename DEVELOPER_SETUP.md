# 🚀 TrackIntern — Developer Onboarding & Setup Guide

Welcome to **TrackIntern**! This document will guide you through setting up and running both the **FastAPI backend** and the **React Native (Expo) mobile app** on your local development machine.

---

## 📁 Repository Structure

```text
Smart-Intern-Verification/
├── backend/                  # FastAPI Backend API
│   ├── alembic/              # Database schema migrations
│   ├── app/                  # Application code
│   │   ├── api/              # API routes (v1 auth, users) & deps
│   │   ├── core/             # Configuration & security (JWT, Argon2id)
│   │   ├── db/               # Database engine & base models
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response validation
│   │   ├── services/         # Business logic
│   │   └── storage/          # File upload storage service
│   ├── tests/                # Automated pytest suite (30+ tests)
│   ├── docker-compose.yml    # PostgreSQL container setup
│   ├── pyproject.toml        # Backend dependencies & metadata
│   └── .env.example          # Template for backend config
│
├── mobile-app/               # React Native (Expo) Mobile Client
│   ├── app/                  # Expo Router file-based screens
│   │   ├── (tabs)/           # Authenticated main app tabs
│   │   ├── login.tsx         # Sign In screen
│   │   ├── register.tsx      # Sign Up screen
│   │   └── _layout.tsx       # Root layout & startup auth guard
│   ├── components/           # Reusable UI components
│   ├── context/              # AuthContext & state providers
│   ├── services/             # ApiService & secure token storage
│   └── package.json          # Mobile dependencies
│
├── DEVELOPER_SETUP.md        # This onboarding guide
└── DATABASE_GUIDE.md         # Database inspection & Neon migration guide
```

---

## 📋 Prerequisites

Install the following on your development machine:

| Tool | Recommended Version | Purpose | Installation Link |
|---|---|---|---|
| **Python** | 3.12+ / 3.13 | Backend runtime | [python.org](https://www.python.org/) |
| **uv** | Latest | Ultra-fast Python package manager | `powershell -c "irm https://astral.sh/uv/install.ps1 \| iex"` |
| **Node.js** | 18+ or 20+ LTS | JavaScript / Mobile runtime | [nodejs.org](https://nodejs.org/) |
| **pnpm** | Latest | Fast package manager for Mobile | `npm install -g pnpm` |
| **Docker** or **Podman** | Any | Running PostgreSQL | [docker.com](https://www.docker.com/) / [podman.io](https://podman.io/) |
| **Expo Go app** | Latest | Testing app on physical device | Android Play Store / iOS App Store |

---

## 🗄️ Part 1: Backend Setup (FastAPI + PostgreSQL)

### 1. Navigate to the backend directory
```bash
cd backend
```

### 2. Start PostgreSQL
Choose either Docker or Podman:

#### Option A: Using Docker
```bash
docker compose up -d
```

#### Option B: Using Podman
```bash
podman run -d --name trackintern-pg -e POSTGRES_DB=trackintern -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16-alpine
```

### 3. Create Environment File
```bash
cp .env.example .env
```
*(Default settings connect to `localhost:5432` with username/password `postgres:postgres`).*

### 4. Install Python Dependencies
```bash
uv sync --all-extras
```

### 5. Run Database Migrations
Applies tables for `users`, `refresh_tokens`, `student_profiles`, and `verification_tokens`:
```bash
uv run alembic upgrade head
```

### 6. Start the Backend Server
```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Backend API Base URL**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

### 7. Run Test Suite
```bash
uv run pytest tests/ -v
```

---

## 📱 Part 2: Mobile App Setup (React Native + Expo)

### 1. Open a new terminal and navigate to the mobile app
```bash
cd mobile-app
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Start Expo Dev Server
```bash
pnpm expo start
```

---

## 📲 Part 3: Running & Testing on Devices

### Option A: Web Browser
- Press **`w`** in the Expo terminal to launch the web client at `http://localhost:8081`.

### Option B: Physical Android Phone via USB (Recommended)
1. Enable **Developer Options $\to$ USB Debugging** on your Android phone.
2. Connect your phone to your PC with a USB cable and tap **Allow USB Debugging**.
3. In a terminal, forward port `8000`:
   ```bash
   adb reverse tcp:8000 tcp:8000
   ```
4. Open the **Expo Go** app on your phone and scan the QR code displayed in the Expo terminal.

### Option C: Physical Device via Wi-Fi / Hotspot
1. Ensure both your computer and mobile phone are connected to the **same Wi-Fi** or Mobile Hotspot.
2. Find your computer's local IPv4 address (e.g. `192.168.1.50` or `10.199.166.217` using `ipconfig`).
3. Create `mobile-app/.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:8000
   ```
4. Scan the QR code in **Expo Go**.

---

## 🔑 Authentication Flow & API Reference

### Startup Auth Lifecycle
```text
Mobile App Launches
       ↓
Check stored token
       ↓
Valid Token? ─── Yes ───► Fetch /auth/status ─── Valid? ───► Main Dashboard (tabs)
       │                                           │
       No                                          No
       ↓                                           ↓
Navigate to /login ◄────────────────────────────────
```

### Core API Endpoints

#### Authentication (`/api/v1/auth`)
- `GET /api/v1/auth/status` — Checks if current session is authenticated
- `POST /api/v1/auth/register` — Registers a new user (`name`, `email`, `registration_number`, `mobile_number`, `password`)
- `POST /api/v1/auth/login` — Issues access token (30m) & refresh token (7d)
- `POST /api/v1/auth/refresh` — Rotates refresh token and issues new access token
- `POST /api/v1/auth/logout` — Revokes current refresh token
- `POST /api/v1/auth/logout-all` — Revokes all active user sessions
- `POST /api/v1/auth/forgot-password` — Requests secure password reset
- `POST /api/v1/auth/reset-password` — Resets password with one-time token
- `POST /api/v1/auth/verify-email` — Verifies email address

#### Users & Profiles (`/api/v1/users`)
- `GET /api/v1/users/me` — Fetches current authenticated user data
- `GET /api/v1/users/me/profile` — Fetches student academic profile
- `POST /api/v1/users/me/profile` — Creates student academic profile (`college`, `branch`, `roll_number`)
- `PATCH /api/v1/users/me/profile` — Updates student profile fields
- `POST /api/v1/users/me/profile/college-id` — Uploads PDF/PNG/JPEG college ID document

---

## 🛠️ Common Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `OSError: [Errno 10061] Connect call failed 127.0.0.1:5432` | PostgreSQL is not running | Start database: `docker compose up -d` or `podman start trackintern-pg`. |
| `Network request timed out` on mobile | Mobile cannot reach laptop's `localhost` | Run `adb reverse tcp:8000 tcp:8000` (for USB) or use your Wi-Fi IP in `EXPO_PUBLIC_API_URL`. |
| `adb.exe: device unauthorized` | Phone hasn't allowed USB debugging | Unlock phone, check "Always allow from this computer", and tap **Allow**. |
| `pnpm` command not found | Node package manager not globally installed | Run `npm install -g pnpm`. |
| Python package conflicts | Outdated virtualenv | Run `uv sync --all-extras` inside `/backend`. |
