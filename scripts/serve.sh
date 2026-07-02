#!/bin/bash
# TITAN Server - Production start script (PostgreSQL)
# For local/container use

set -e

PROJECT_DIR="/home/z/my-project"
LOG="/tmp/server.log"
KEEPALIVE_LOG="/tmp/keepalive.log"

# Ensure DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "[$(date)] ERROR: DATABASE_URL not set" >> "$KEEPALIVE_LOG"
  exit 1
fi

# Push schema on start
echo "[$(date)] Syncing database schema..." >> "$KEEPALIVE_LOG"
cd "$PROJECT_DIR" && npx prisma db push --skip-generate >> "$KEEPALIVE_LOG" 2>&1

echo "[$(date)] Starting TITAN server on port 3000" >> "$KEEPALIVE_LOG"

while true; do
  echo "[$(date)] Server starting..." >> "$KEEPALIVE_LOG"
  cd "$PROJECT_DIR"
  node .next/standalone/server.js >> "$LOG" 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited (code=$EXIT_CODE)" >> "$KEEPALIVE_LOG"
  if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date)] Clean shutdown" >> "$KEEPALIVE_LOG"
    break
  fi
  echo "[$(date)] Restarting in 2s..." >> "$KEEPALIVE_LOG"
  sleep 2
done