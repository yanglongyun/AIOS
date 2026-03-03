#!/usr/bin/env bash
set -euo pipefail

# One-click install for Linux (Ubuntu/Debian) and macOS
# Usage:
#   bash install.sh

REPO_URL="${REPO_URL:-https://github.com/valueriver/aios.git}"
APP_NAME="${APP_NAME:-aios}"
LOCAL_PORT="${LOCAL_PORT:-9700}"
APPS_PORT="${APPS_PORT:-9701}"

PLATFORM="$(uname -s)"

if [ "$PLATFORM" = "Darwin" ]; then
  APP_DIR="${APP_DIR:-$HOME/aios}"
else
  APP_DIR="${APP_DIR:-/opt/aios}"
fi

# ── 1. 安装系统依赖 ──────────────────────────────────────

echo "[1/5] Check dependencies..."

if [ "$PLATFORM" = "Darwin" ]; then
  if ! command -v brew >/dev/null 2>&1; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    [ -f /opt/homebrew/bin/brew ] && eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
  if ! command -v git >/dev/null 2>&1; then brew install git; fi
  if ! command -v node >/dev/null 2>&1; then brew install node; fi
  NODE_MAJOR="$(node -v | sed 's/v\([0-9]*\).*/\1/')"
  if [ "${NODE_MAJOR}" -lt 22 ]; then brew upgrade node; fi

elif [ "$PLATFORM" = "Linux" ]; then
  if ! command -v apt-get >/dev/null 2>&1; then
    echo "Only Ubuntu/Debian is supported on Linux."
    exit 1
  fi
  sudo apt-get update -qq
  sudo apt-get install -y curl git build-essential nginx

  if command -v node >/dev/null 2>&1; then
    NODE_MAJOR="$(node -v | sed 's/v\([0-9]*\).*/\1/')"
  else
    NODE_MAJOR="0"
  fi
  if [ "${NODE_MAJOR}" -lt 22 ]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi

else
  echo "Unsupported platform: $PLATFORM"
  exit 1
fi

# ── 2. 拉取代码 ──────────────────────────────────────────

echo "[2/5] Pull code..."

if [ "$PLATFORM" = "Darwin" ]; then
  mkdir -p "$(dirname "$APP_DIR")"
  if [ ! -d "$APP_DIR/.git" ]; then
    git clone "$REPO_URL" "$APP_DIR"
  else
    git -C "$APP_DIR" pull --ff-only
  fi
else
  SERVICE_USER="${SERVICE_USER:-$USER}"
  sudo mkdir -p "$(dirname "$APP_DIR")"
  if [ ! -d "$APP_DIR/.git" ]; then
    sudo git clone "$REPO_URL" "$APP_DIR"
  else
    sudo git -C "$APP_DIR" pull --ff-only
  fi
  sudo chown -R "$SERVICE_USER":"$SERVICE_USER" "$APP_DIR"
fi

# ── 3. 安装依赖 + 构建 UI ────────────────────────────────

echo "[3/5] Install deps + build UI..."
cd "$APP_DIR"
npm install
npm run build
npm link

NPM_GLOBAL_BIN="$(npm prefix -g)/bin"
SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then SHELL_RC="$HOME/.bashrc"
elif [ -f "$HOME/.bash_profile" ]; then SHELL_RC="$HOME/.bash_profile"
fi
if [ -n "$SHELL_RC" ] && ! grep -q "$NPM_GLOBAL_BIN" "$SHELL_RC" 2>/dev/null; then
  echo "export PATH=\"$NPM_GLOBAL_BIN:\$PATH\"" >> "$SHELL_RC"
fi
export PATH="$NPM_GLOBAL_BIN:$PATH"

# ── 4. 配置守护进程 ──────────────────────────────────────

echo "[4/5] Setup daemon..."
NODE_BIN="$(which node)"

if [ "$PLATFORM" = "Darwin" ]; then
  # 主服务
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

  # 应用服务
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

else
  SERVICE_USER="${SERVICE_USER:-$USER}"

  # 主服务
  sudo tee /etc/systemd/system/${APP_NAME}.service >/dev/null <<EOF
[Unit]
Description=AIOS - Main Server
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${APP_DIR}
ExecStart=${NODE_BIN} server/index.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

  # 应用服务
  sudo tee /etc/systemd/system/${APP_NAME}-apps.service >/dev/null <<EOF
[Unit]
Description=AIOS - Apps Server
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${APP_DIR}
ExecStart=${NODE_BIN} apps/index.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable "${APP_NAME}" "${APP_NAME}-apps"
  sudo systemctl restart "${APP_NAME}" "${APP_NAME}-apps"

  # Nginx 反向代理
  DOMAIN="${DOMAIN:-_}"
  NGINX_CONF="/etc/nginx/sites-available/${APP_NAME}"
  sudo tee "$NGINX_CONF" >/dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:${LOCAL_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

  sudo ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/${APP_NAME}"
  [ -f /etc/nginx/sites-enabled/default ] && sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t
  sudo systemctl restart nginx
fi

# ── 5. 完成 ─────────────────────────────────────────────

echo
echo "Done."
echo

if [ "$PLATFORM" = "Darwin" ]; then
  echo "  主服务:    launchctl print gui/$(id -u)/ai.${APP_NAME}.server"
  echo "  应用服务:  launchctl print gui/$(id -u)/ai.${APP_NAME}.apps"
  echo "  日志:      launchctl print gui/$(id -u)/ai.${APP_NAME}.server"
else
  echo "  主服务:    systemctl status ${APP_NAME}"
  echo "  应用服务:  systemctl status ${APP_NAME}-apps"
  echo "  日志:      journalctl -u ${APP_NAME} -f"
fi

echo
echo "  CLI:   aios"
echo "  Web:   http://localhost:${LOCAL_PORT}"
echo
echo "  注意：如果 aios 命令不可用，请重新加载 shell："
echo "    source ~/.zshrc   # 或 source ~/.bashrc"
echo
