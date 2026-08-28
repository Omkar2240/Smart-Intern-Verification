# TrackIntern Backend

FastAPI backend for the TrackIntern mobile internship attendance and verification application.

## Tech Stack

- **FastAPI** — async web framework
- **PostgreSQL** — database
- **SQLAlchemy 2.x** — async ORM
- **Alembic** — database migrations
- **Argon2id** — password hashing
- **JWT** — stateless authentication
- **Pydantic v2** — validation & serialization

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Install dependencies

```bash
uv sync --all-extras
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your settings (DATABASE_URL, SECRET_KEY, etc.)
```

### 4. Run migrations

```bash
uv run alembic upgrade head
```

### 5. Start the server

```bash
uv run uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000` and Swagger docs at `http://localhost:8000/docs`.

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/status` | Check authentication status |
| `POST` | `/register` | Register a new user |
| `POST` | `/login` | Login with email/password |
| `POST` | `/refresh` | Rotate refresh token |
| `POST` | `/logout` | Revoke a refresh token |
| `POST` | `/logout-all` | Revoke all sessions |
| `POST` | `/verify-email` | Verify email with token |
| `POST` | `/resend-verification` | Resend verification email |
| `POST` | `/forgot-password` | Request password reset |
| `POST` | `/reset-password` | Reset password with token |

### Users (`/api/v1/users`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/me` | Get current user |
| `GET` | `/me/profile` | Get student profile |
| `POST` | `/me/profile` | Create student profile |
| `PATCH` | `/me/profile` | Update student profile |
| `POST` | `/me/profile/college-id` | Upload college ID document |

## Running Tests

```bash
uv run pytest tests/ -v
```

## Project Structure

```
backend/
├── alembic/              # Database migrations
├── app/
│   ├── api/              # API routes & dependencies
│   │   ├── deps.py       # Shared dependencies (auth, DB)
│   │   └── v1/           # v1 API routes
│   │       ├── auth/     # Auth endpoints
│   │       └── users/    # User/profile endpoints
│   ├── core/             # Config & security
│   ├── db/               # Database engine & base models
│   ├── models/           # SQLAlchemy ORM models
│   ├── schemas/          # Pydantic request/response schemas
│   ├── services/         # Business logic layer
│   ├── storage/          # File storage abstraction
│   └── main.py           # App entry point
├── tests/                # Test suite
├── docker-compose.yml    # PostgreSQL for development
├── .env.example          # Environment template
└── pyproject.toml        # Dependencies
```
