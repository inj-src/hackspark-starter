#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

bash "$ROOT_DIR/scripts/run-rental-scraper.sh" &
RENTAL_PID=$!

bash "$ROOT_DIR/scripts/run-analytics-scraper.sh" &
ANALYTICS_PID=$!

cleanup() {
  kill "$RENTAL_PID" "$ANALYTICS_PID" 2>/dev/null || true
  wait "$RENTAL_PID" "$ANALYTICS_PID" 2>/dev/null || true
}

trap cleanup SIGINT SIGTERM EXIT

wait "$RENTAL_PID" "$ANALYTICS_PID"
