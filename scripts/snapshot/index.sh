#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

section() {
  printf "\n==== %s ====\n" "$1"
}

run() {
  local title="$1"
  shift
  section "${title}"
  if "$@" 2>&1; then
    true
  else
    echo "(command failed: $*)"
  fi
}

{
  echo "AIOS Snapshot"
  echo "Generated at: $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo "Host: $(hostname)"
  echo "User: $(whoami)"
  echo "Root: ${ROOT_DIR}"
}

run "OS / Kernel" uname -a
run "Uptime" uptime
run "Node / NPM" bash -lc 'node -v && npm -v'

section "Git"
(
  cd "${ROOT_DIR}"
  git rev-parse --abbrev-ref HEAD
  git rev-parse --short HEAD
  git status --short
) 2>&1 || echo "(git info unavailable)"

section "AIOS CLI Status"
if command -v aios >/dev/null 2>&1; then
  aios status 2>&1 || true
else
  echo "aios command not found"
fi

section "Ports 9700/9701"
if command -v lsof >/dev/null 2>&1; then
  lsof -nP -iTCP:9700 -sTCP:LISTEN 2>&1 || true
  lsof -nP -iTCP:9701 -sTCP:LISTEN 2>&1 || true
elif command -v ss >/dev/null 2>&1; then
  ss -lntp | grep -E ':9700|:9701' 2>&1 || true
else
  echo "no lsof/ss available"
fi

section "Health Endpoints"
curl -sS -m 3 http://localhost:9700/api/health 2>&1 || echo "main health failed"
echo
curl -sS -m 3 http://localhost:9701/apps/health 2>&1 || echo "apps health failed"

run "Disk Usage" df -h
if command -v free >/dev/null 2>&1; then
  run "Memory" free -h
elif command -v vm_stat >/dev/null 2>&1; then
  run "Memory" vm_stat
fi

section "Database Files (Top 20 by size)"
if [ -d "${ROOT_DIR}/database" ]; then
  if command -v gfind >/dev/null 2>&1; then
    gfind "${ROOT_DIR}/database" -type f -print0 | xargs -0 ls -lhS | head -n 20 2>&1 || true
  else
    find "${ROOT_DIR}/database" -type f -print0 | xargs -0 ls -lhS | head -n 20 2>&1 || true
  fi
else
  echo "database dir not found"
fi

section "Recent Main/App Logs"
for f in /tmp/aios-main.out /tmp/aios-apps.out; do
  echo "-- ${f} --"
  if [ -f "${f}" ]; then
    tail -n 80 "${f}" 2>&1 || true
  else
    echo "(not found)"
  fi
  echo
done

section "Project Files Quick View"
(
  cd "${ROOT_DIR}"
  ls -la
  echo
  echo "scripts/:"
  ls -la scripts
) 2>&1 || true
