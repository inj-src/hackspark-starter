#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export DISABLE_SCRAPER=true

echo "[local] starting scraper loop..."
pnpm scrape:loop &
SCRAPER_PID=$!

echo "[local] starting hono server..."
pnpm start &
SERVER_PID=$!

cleanup() {
  echo "[local] stopping processes..."
  kill "$SCRAPER_PID" "$SERVER_PID" 2>/dev/null || true
  wait "$SCRAPER_PID" "$SERVER_PID" 2>/dev/null || true
}

trap cleanup SIGINT SIGTERM EXIT

wait "$SCRAPER_PID" "$SERVER_PID"
