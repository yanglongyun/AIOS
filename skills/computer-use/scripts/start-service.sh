#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
PORT="${COMPUTER_USE_PORT:-8766}"

cd "$ROOT"
exec node skills/computer-use/service/server.js --port "$PORT"
