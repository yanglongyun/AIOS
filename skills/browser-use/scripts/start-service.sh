#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
PORT="${BROWSER_USE_PORT:-8765}"

cd "$ROOT"
exec node skills/browser-use/service/server.js --port "$PORT"
