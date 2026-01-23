#!/bin/sh
set -e

# Extract database connection details from DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set!"
  exit 1
fi

# Parse database connection (simplified)
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):\([^/]*\).*/\1/p' 2>/dev/null || echo "db")
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):\([^/]*\).*/\2/p' 2>/dev/null || echo "5432")
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p' 2>/dev/null || echo "thefeeder")

# Wait for database to be ready (Compose already waits for db healthy; short loop is enough)
MAX_ATTEMPTS=10
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))
  
  if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -t 1 > /dev/null 2>&1; then
    break
  fi
  
  if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
    sleep 1
  else
    echo "ERROR: Database connection failed after $MAX_ATTEMPTS attempts!"
    exit 1
  fi
done

# Migrations are run by the web-migrate service before this container starts.

# Run database seed in background (do not block server startup)
(npx prisma db seed > /dev/null 2>&1 || npx tsx prisma/seed.ts > /dev/null 2>&1 || true) &

# Start Next.js standalone server (HOSTNAME=0.0.0.0 so healthcheck on 127.0.0.1 works)
exec env HOSTNAME=0.0.0.0 node server.js

