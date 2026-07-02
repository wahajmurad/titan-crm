#!/bin/bash
# TITAN Server - Production start script
# Uses standalone build + keepalive + writable /tmp DB

set -e

DB_PATH="/tmp/titan.db"
PROJECT_DIR="/home/z/my-project"
STANDALONE_DIR="$PROJECT_DIR/.next/standalone"
LOG="/tmp/server.log"
KEEPALIVE_LOG="/tmp/keepalive.log"

# 1. Ensure DB exists and is synced
if [ ! -f "$DB_PATH" ]; then
  echo "[$(date)] Creating database at $DB_PATH" >> "$KEEPALIVE_LOG"
  cd "$PROJECT_DIR" && DATABASE_URL="file:$DB_PATH" npx prisma db push --skip-generate >> "$KEEPALIVE_LOG" 2>&1
  chmod 666 "$DB_PATH"
fi

# 2. Start server with auto-restart on crash
echo "[$(date)] Starting TITAN production server on port 3000" >> "$KEEPALIVE_LOG"

while true; do
  echo "[$(date)] Server starting..." >> "$KEEPALIVE_LOG"
  cd "$STANDALONE_DIR"
  DATABASE_URL="file:$DB_PATH" node server.js >> "$LOG" 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited (code=$EXIT_CODE)" >> "$KEEPALIVE_LOG"
  if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date)] Clean shutdown" >> "$KEEPALIVE_LOG"
    break
  fi
  echo "[$(date)] Restarting in 2s..." >> "$KEEPALIVE_LOG"
  sleep 2
done