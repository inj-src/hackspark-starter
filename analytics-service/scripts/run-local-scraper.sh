#!/usr/bin/env bash
set -euo pipefail

cd /home/inj-src/workspace/hackspark/hackspark-starter/analytics-service

echo "[local-scraper] starting continuous scrape loop"
pnpm scrape:loop
