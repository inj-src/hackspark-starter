#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[local] starting hono server..."
npm run start

cleanup() {
  echo "[local] stopping processes..."
  true
}

trap cleanup SIGINT SIGTERM EXIT
