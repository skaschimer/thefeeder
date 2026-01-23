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

# Run database migrations (output visible for debugging failures)
if ! npx prisma migrate deploy; then
  echo "ERROR: Database migration failed!"
  exit 1
fi

exit 0
