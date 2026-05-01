#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/analytics-service"

echo "[analytics-scraper] starting continuous scrape loop"
npm run scrape:loop
