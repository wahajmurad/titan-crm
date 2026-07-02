#!/bin/bash
# Initialize TITAN database at runtime-writable location
# This script ensures the SQLite DB lives on a writable filesystem

set -e

DB_PATH="/tmp/titan.db"
PROJECT_DIR="/home/z/my-project"
SCHEMA_FILE="$PROJECT_DIR/prisma/schema.prisma"

# If DB doesn't exist at /tmp, copy from project (if available) or create fresh
if [ ! -f "$DB_PATH" ]; then
  if [ -f "$PROJECT_DIR/db/custom.db" ]; then
    cp "$PROJECT_DIR/db/custom.db" "$DB_PATH"
    echo "[init-db] Copied existing DB to $DB_PATH"
  else
    echo "[init-db] No existing DB found, will create fresh"
  fi
fi

# Ensure proper permissions
chmod 666 "$DB_PATH" 2>/dev/null || true

# Push schema to ensure DB is up to date
cd "$PROJECT_DIR"
npx prisma db push --skip-generate 2>&1 | tail -3
echo "[init-db] Database ready at $DB_PATH"