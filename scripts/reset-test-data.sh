#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT_DIR"

echo "[reset] stopping compose stack and removing named volumes"
docker compose down -v --remove-orphans >/dev/null 2>&1 || true

echo "[reset] removing local runtime data"
rm -rf database files

echo "[reset] recreating runtime directories"
mkdir -p database files/uploads files/exports files/tmp

echo "[reset] done"
