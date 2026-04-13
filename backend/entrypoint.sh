#!/bin/bash
set -e

echo "⏳ Waiting for database at $POSTGRES_HOST:$POSTGRES_PORT..."
while ! nc -z "$POSTGRES_HOST" "$POSTGRES_PORT"; do
  sleep 1
done
echo "✅ Database is ready!"

echo "🔄 Running Alembic migrations..."
python -m alembic upgrade head

if [ "$ENVIRONMENT" = "development" ]; then
  echo "🚀 Starting FastAPI in DEVELOPMENT mode with auto-reload..."
  exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
else
  echo "🚀 Starting FastAPI in PRODUCTION mode..."
  exec uvicorn app.main:app --host 0.0.0.0 --port 8000
fi