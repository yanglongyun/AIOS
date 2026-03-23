#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/valueriver/aios.git"
APP_NAME="aios"
APP_DIR="$HOME/aios"
LOCAL_PORT="9700"

if [ "$(uname -s)" != "Darwin" ]; then
  echo "install-macos.sh only supports macOS."
  exit 1
fi

echo "[1/5] Check dependencies..."
if ! command -v brew >/dev/null 2>&1; then
  echo "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  if [ -f /opt/homebrew/bin/brew ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
fi
if ! command -v git >/dev/null 2>&1; then brew install git; fi
if ! command -v node >/dev/null 2>&1; then brew install node; fi
NODE_MAJOR="$(node -v | sed 's/v\([0-9]*\).*/\1/')"
if [ "${NODE_MAJOR}" -lt 22 ]; then brew upgrade node; fi

echo "[2/5] Pull code..."
mkdir -p "$(dirname "$APP_DIR")"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" pull --ff-only
fi

echo "[3/5] Install deps + build UI..."
cd "$APP_DIR"
npm ci
npm run build
npm link

NPM_GLOBAL_BIN="$(npm prefix -g)/bin"
SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then SHELL_RC="$HOME/.zshrc"; fi
if [ -z "$SHELL_RC" ] && [ -f "$HOME/.bashrc" ]; then SHELL_RC="$HOME/.bashrc"; fi
if [ -z "$SHELL_RC" ] && [ -f "$HOME/.bash_profile" ]; then SHELL_RC="$HOME/.bash_profile"; fi
if [ -n "$SHELL_RC" ] && ! grep -q "$NPM_GLOBAL_BIN" "$SHELL_RC" 2>/dev/null; then
  echo "export PATH=\"$NPM_GLOBAL_BIN:\$PATH\"" >> "$SHELL_RC"
fi
export PATH="$NPM_GLOBAL_BIN:$PATH"

echo "[4/5] Setup daemon..."
NODE_BIN="$(which node)"

LABEL_SERVER="ai.${APP_NAME}.server"
PLIST_SERVER="$HOME/Library/LaunchAgents/${LABEL_SERVER}.plist"
launchctl bootout "gui/$(id -u)/${LABEL_SERVER}" 2>/dev/null || true
cat > "$PLIST_SERVER" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL_SERVER}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${NODE_BIN}</string>
    <string>${APP_DIR}/server/index.js</string>
  </array>
  <key>WorkingDirectory</key><string>${APP_DIR}</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>StandardOutPath</key><string>/dev/null</string>
  <key>StandardErrorPath</key><string>/dev/null</string>
</dict>
</plist>
EOF
launchctl bootstrap "gui/$(id -u)" "$PLIST_SERVER"
launchctl kickstart -k "gui/$(id -u)/${LABEL_SERVER}"

LABEL_APPS="ai.${APP_NAME}.apps"
PLIST_APPS="$HOME/Library/LaunchAgents/${LABEL_APPS}.plist"
launchctl bootout "gui/$(id -u)/${LABEL_APPS}" 2>/dev/null || true
cat > "$PLIST_APPS" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL_APPS}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${NODE_BIN}</string>
    <string>${APP_DIR}/apps/index.js</string>
  </array>
  <key>WorkingDirectory</key><string>${APP_DIR}</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>StandardOutPath</key><string>/dev/null</string>
  <key>StandardErrorPath</key><string>/dev/null</string>
</dict>
</plist>
EOF
launchctl bootstrap "gui/$(id -u)" "$PLIST_APPS"
launchctl kickstart -k "gui/$(id -u)/${LABEL_APPS}"

echo
echo "Done."
echo
echo "  Main:  launchctl print gui/$(id -u)/${LABEL_SERVER}"
echo "  Apps:  launchctl print gui/$(id -u)/${LABEL_APPS}"
echo "  CLI:   aios"
echo "  Web:   http://localhost:${LOCAL_PORT}"
echo
