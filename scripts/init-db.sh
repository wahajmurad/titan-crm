#!/bin/bash
# Initialize TITAN database
# Works with PostgreSQL (local or cloud)

set -e

cd /home/z/my-project

if [ -z "$DATABASE_URL" ]; then
  echo "[init-db] ERROR: DATABASE_URL not set"
  echo "[init-db] Set it in .env or as environment variable"
  echo "[init-db] Example: postgresql://user:password@host:5432/dbname"
  exit 1
fi

echo "[init-db] Pushing schema to database..."
npx prisma db push --skip-generate 2>&1
echo "[init-db] Database ready"