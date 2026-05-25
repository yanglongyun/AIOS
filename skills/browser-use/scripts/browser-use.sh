#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BROWSER_USE_URL:-http://127.0.0.1:8765}"
TOOL="${1:-}"
ARGS="${2:-{}}"

if [ -z "$TOOL" ]; then
  echo "用法: $0 <tool> [json_args]" >&2
  exit 1
fi

node -e "JSON.parse(process.argv[1])" "$ARGS" >/dev/null

curl -sS -X POST "$BASE_URL/call" \
  -H 'Content-Type: application/json' \
  -d "{\"tool\":$(node -e "process.stdout.write(JSON.stringify(process.argv[1]))" "$TOOL"),\"args\":$ARGS}"
