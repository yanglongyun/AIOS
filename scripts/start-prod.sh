#!/usr/bin/env bash
set -euo pipefail

npm run start &
server_pid=$!

npm run start:apps &
apps_pid=$!

shutdown() {
  kill "$server_pid" "$apps_pid" 2>/dev/null || true
  wait "$server_pid" 2>/dev/null || true
  wait "$apps_pid" 2>/dev/null || true
}

trap shutdown INT TERM

set +e
wait -n "$server_pid" "$apps_pid"
status=$?
set -e

shutdown
exit "$status"
