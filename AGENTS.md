# AGENTS.md

## Critical: Shared Cache Contract

This repository uses a single shared cache at the repo root:

- Canonical cache directory: `./cache`
- Canonical cache files:
  - `cache/meta.json`
  - `cache/products.ndjson`
  - `cache/rentals.ndjson`

## Service Cache Usage

- `rental-service` reads/writes the shared cache.
- `analytics-service` reads the same shared cache (and can write if scraper is enabled).
- Services that do not implement cache-store logic (`api-gateway`, `user-service`, `agentic-service`, `frontend`) should not create private cache files.

## Docker Compose Mounts

Both cache-backed services mount the same host directory:

- `./cache:/cache`

Expected env vars inside containers:

- `RENTAL_CACHE_DIR=/cache`
- `ANALYTICS_CACHE_DIR=/cache`

## Local Development Defaults

When running services locally from their own directories (without Docker), default cache fallback is:

- `../cache`

This is implemented in both service entrypoints and scraper CLIs.

## Root Scraper Scripts

Scraper shell entrypoints are centralized at repo root:

- `scripts/run-rental-scraper.sh`
- `scripts/run-analytics-scraper.sh`
- `scripts/run-all-scrapers.sh`

Service package scripts `scrape:local` should call these root scripts (not service-local script copies).

## Safety Notes

- Keep cache file schema stable across services.
- Avoid running multiple scraper loops writing to the same cache concurrently unless intentionally coordinated.
- If cache format changes, update both `rental-service` and `analytics-service` together.
