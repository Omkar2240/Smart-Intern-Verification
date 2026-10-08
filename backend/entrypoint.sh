#!/bin/sh
set -e

echo "=== Starting TrackIntern Backend ==="
echo "Binding to host 0.0.0.0 and port ${PORT:-8000}..."

# Run database migrations
echo "Running database migrations..."
if uv run alembic upgrade head; then
    echo "Database migrations completed successfully."
else
    echo "WARNING: Alembic migration failed or database unreachable. Proceeding with server startup..."
fi

# Start uvicorn server binding to dynamic $PORT
echo "Starting Uvicorn on 0.0.0.0:${PORT:-8000}..."
exec uv run uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
