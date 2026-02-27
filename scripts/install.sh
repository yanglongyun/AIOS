#!/usr/bin/env bash
set -euo pipefail

# One-click install for Linux (Ubuntu/Debian) and macOS
# Usage:
#   bash scripts/install.sh
#   curl -fsSL https://your-domain/install.sh | bash

REPO_URL="${REPO_URL:-https://github.com/valueriver/aios.git}"
APP_NAME="${APP_NAME:-aios}"
LOCAL_PORT="${LOCAL_PORT:-3000}"
APPS_PORT="${APPS_PORT:-3001}"

PLATFORM="$(uname -s)"

# 平台默认安装目录
if [ "$PLATFORM" = "Darwin" ]; then
  APP_DIR="${APP_DIR:-$HOME/aios}"
else
  APP_DIR="${APP_DIR:-/opt/aios}"
fi

# ── 1. 安装系统依赖 ──────────────────────────────────────

echo "[1/6] Check dependencies..."

if [ "$PLATFORM" = "Darwin" ]; then
  # macOS：没有 brew 就先装 brew
  if ! command -v brew >/dev/null 2>&1; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    # Apple Silicon 路径
    [ -f /opt/homebrew/bin/brew ] && eval "$(/opt/homebrew/bin/brew shellenv)"
  fi

  # 装 git
  if ! command -v git >/dev/null 2>&1; then
    echo "Installing git..."
    brew install git
  fi

  # 装 node
  if ! command -v node >/dev/null 2>&1; then
    echo "Installing Node.js..."
    brew install node
  fi
  NODE_MAJOR="$(node -v | sed 's/v\([0-9]*\).*/\1/')"
  if [ "${NODE_MAJOR}" -lt 22 ]; then
    echo "Upgrading Node.js to latest..."
    brew upgrade node
  fi

elif [ "$PLATFORM" = "Linux" ]; then
  if ! command -v apt-get >/dev/null 2>&1; then
    echo "Only Ubuntu/Debian is supported on Linux."
    exit 1
  fi
  sudo apt-get update -qq
  sudo apt-get install -y curl git build-essential nginx

  # 安装 Node.js 22
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

echo "[2/6] Pull code..."

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

echo "[3/6] Install deps + build UI..."
cd "$APP_DIR"
npm install
npm run build
npm link

# 确保 npm global bin 在 PATH 里
NPM_GLOBAL_BIN="$(npm prefix -g)/bin"
SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then
  SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
  SHELL_RC="$HOME/.bashrc"
elif [ -f "$HOME/.bash_profile" ]; then
  SHELL_RC="$HOME/.bash_profile"
fi
if [ -n "$SHELL_RC" ] && ! grep -q "$NPM_GLOBAL_BIN" "$SHELL_RC" 2>/dev/null; then
  echo "export PATH=\"$NPM_GLOBAL_BIN:\$PATH\"" >> "$SHELL_RC"
fi
export PATH="$NPM_GLOBAL_BIN:$PATH"

# ── 4. 初始化 .env ───────────────────────────────────────

echo "[4/6] Init .env..."
if [ ! -f .env ]; then
  cp .env.example .env
fi
if ! grep -q '^LOCAL_PORT=' .env; then
  echo "LOCAL_PORT=${LOCAL_PORT}" >> .env
fi
if ! grep -q '^APPS_PORT=' .env; then
  echo "APPS_PORT=${APPS_PORT}" >> .env
fi

# ── 5. 配置守护进程 ──────────────────────────────────────

echo "[5/6] Setup daemon..."
NODE_BIN="$(which node)"

if [ "$PLATFORM" = "Darwin" ]; then
  # macOS: launchd
  LAUNCH_AGENT_LABEL="ai.${APP_NAME}.server"
  PLIST_PATH="$HOME/Library/LaunchAgents/${LAUNCH_AGENT_LABEL}.plist"
  LOG_DIR="$HOME/.${APP_NAME}/logs"
  mkdir -p "$LOG_DIR"

  # 停掉旧的（忽略错误）
  launchctl bootout "gui/$(id -u)/${LAUNCH_AGENT_LABEL}" 2>/dev/null || true

  cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LAUNCH_AGENT_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${NODE_BIN}</string>
    <string>${APP_DIR}/index.js</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${APP_DIR}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>LOCAL_PORT</key>
    <string>${LOCAL_PORT}</string>
    <key>APPS_PORT</key>
    <string>${APPS_PORT}</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>10</integer>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/server.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/server.err.log</string>
</dict>
</plist>
EOF

  launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH"
  launchctl kickstart -k "gui/$(id -u)/${LAUNCH_AGENT_LABEL}"

else
  # Linux: systemd
  SERVICE_USER="${SERVICE_USER:-$USER}"
  sudo tee /etc/systemd/system/${APP_NAME}.service >/dev/null <<EOF
[Unit]
Description=aios - AI Agent Server
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${APP_DIR}
ExecStart=${NODE_BIN} index.js
Restart=always
RestartSec=5
EnvironmentFile=${APP_DIR}/.env
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable "${APP_NAME}"
  sudo systemctl restart "${APP_NAME}"

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

# ── 6. 完成 ─────────────────────────────────────────────

echo
echo "Done."
echo

if [ "$PLATFORM" = "Darwin" ]; then
  LAUNCH_AGENT_LABEL="ai.${APP_NAME}.server"
  PLIST_PATH="$HOME/Library/LaunchAgents/${LAUNCH_AGENT_LABEL}.plist"
  LOG_DIR="$HOME/.${APP_NAME}/logs"
  echo "  Service:"
  echo "    status:  launchctl print gui/$(id -u)/${LAUNCH_AGENT_LABEL}"
  echo "    stop:    launchctl bootout gui/$(id -u)/${LAUNCH_AGENT_LABEL}"
  echo "    start:   launchctl bootstrap gui/$(id -u) ${PLIST_PATH}"
  echo "    logs:    tail -f ${LOG_DIR}/server.log"
else
  echo "  Service:  systemctl status ${APP_NAME}"
  echo "  Logs:     journalctl -u ${APP_NAME} -f"
  echo "  URL:      http://<server-ip>"
fi

echo
echo "  CLI:      aios"
echo "  Web:      http://localhost:${LOCAL_PORT}"
echo
echo "  注意：如果 aios 命令不可用，请重新加载 shell："
echo "    source ~/.zshrc   # 或 source ~/.bashrc"
echo
