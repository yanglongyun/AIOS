#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
PORT="${COMPUTER_USE_TEST_PORT:-19521}"
BASE_URL="http://127.0.0.1:$PORT"
LOG_FILE="${TMPDIR:-/tmp}/computer-use-test.log"
SCREENSHOT_PATH="${COMPUTER_USE_TEST_SCREENSHOT:-/tmp/computer-use-test.png}"

cd "$ROOT"

node skills/computer-use/service/server.js --port "$PORT" >"$LOG_FILE" 2>&1 &
PID="$!"
cleanup() {
  kill "$PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

for _ in $(seq 1 50); do
  if curl -fsS "$BASE_URL/status" >/dev/null 2>&1; then
    break
  fi
  sleep 0.1
done

echo "status:"
curl -fsS "$BASE_URL/status"
echo

echo "tools:"
curl -fsS "$BASE_URL/tools" >/dev/null
echo "ok"

echo "call computer_status:"
curl -fsS -X POST "$BASE_URL/call" \
  -H 'Content-Type: application/json' \
  -d '{"tool":"computer_status","args":{}}'
echo

echo "call computer_screenshot:"
curl -fsS -X POST "$BASE_URL/call" \
  -H 'Content-Type: application/json' \
  -d "{\"tool\":\"computer_screenshot\",\"args\":{\"outputPath\":\"$SCREENSHOT_PATH\"}}"
echo

test -s "$SCREENSHOT_PATH"
echo "screenshot saved: $SCREENSHOT_PATH"
