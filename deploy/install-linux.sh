#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/valueriver/aios.git"
APP_NAME="aios"
APP_DIR="/opt/aios"
LOCAL_PORT="9700"
SERVICE_USER="$(id -un)"
ENV_FILE="/etc/default/aios"

if [ "$(uname -s)" != "Linux" ]; then
  echo "install-linux-litellm.sh only supports Linux."
  exit 1
fi
if ! command -v apt-get >/dev/null 2>&1; then
  echo "Only Ubuntu/Debian is supported on Linux."
  exit 1
fi

echo "[0/5] LiteLLM configuration..."
read -rp "LITELLM_URL (e.g. http://localhost:4000): " LITELLM_URL
read -rp "LITELLM_KEY: " LITELLM_KEY
if [ -z "$LITELLM_URL" ] || [ -z "$LITELLM_KEY" ]; then
  echo "LITELLM_URL and LITELLM_KEY are required."
  exit 1
fi

echo "[1/5] Check dependencies..."
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

echo "[2/5] Pull code..."
sudo mkdir -p "$(dirname "$APP_DIR")"
if [ ! -d "$APP_DIR/.git" ]; then
  sudo git clone "$REPO_URL" "$APP_DIR"
else
  sudo git -C "$APP_DIR" pull --ff-only
fi
sudo chown -R "$SERVICE_USER":"$SERVICE_USER" "$APP_DIR"

echo "[3/5] Install deps + build UI..."
cd "$APP_DIR"

echo "  Applying LiteLLM overlay..."
cp siderclaw/server/api/llm.js server/api/llm.js
cp siderclaw/server/api/index.js server/api/index.js
cp siderclaw/server/service/settings/get.js server/service/settings/get.js
cp siderclaw/ui/src/views/WelcomeView.vue ui/src/views/WelcomeView.vue

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

sudo tee "$ENV_FILE" >/dev/null <<EOF
LITELLM_URL=${LITELLM_URL}
LITELLM_KEY=${LITELLM_KEY}
EOF
sudo chmod 600 "$ENV_FILE"

sudo tee /etc/systemd/system/${APP_NAME}.service >/dev/null <<EOF
[Unit]
Description=AIOS - Main Server
After=network.target

[Service]
Type=simple
EnvironmentFile=-${ENV_FILE}
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

sudo tee /etc/systemd/system/${APP_NAME}-apps.service >/dev/null <<EOF
[Unit]
Description=AIOS - Apps Server
After=network.target ${APP_NAME}.service
Requires=${APP_NAME}.service

[Service]
Type=simple
EnvironmentFile=-${ENV_FILE}
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

DOMAIN="_"
NGINX_MANAGED_MARKER="# managed-by-aios-installer"
NGINX_CONF="/etc/nginx/sites-available/${APP_NAME}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${APP_NAME}"

if sudo test -f "$NGINX_CONF" && ! sudo grep -Fxq "$NGINX_MANAGED_MARKER" "$NGINX_CONF"; then
  echo "Refuse to overwrite unmanaged nginx config: $NGINX_CONF"
  exit 1
fi

sudo tee "$NGINX_CONF" >/dev/null <<EOF
$NGINX_MANAGED_MARKER
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

if sudo test -e "$NGINX_ENABLED"; then
  if ! sudo test -L "$NGINX_ENABLED"; then
    echo "Refuse to modify non-symlink nginx entry: $NGINX_ENABLED"
    exit 1
  fi
  CURRENT_TARGET="$(sudo readlink -f "$NGINX_ENABLED")"
  EXPECTED_TARGET="$(sudo readlink -f "$NGINX_CONF")"
  if [ "$CURRENT_TARGET" != "$EXPECTED_TARGET" ]; then
    echo "Refuse to replace nginx symlink pointing to another config: $NGINX_ENABLED"
    exit 1
  fi
fi

sudo ln -sfn "$NGINX_CONF" "$NGINX_ENABLED"
sudo nginx -t
sudo systemctl reload nginx

echo
echo "Done."
echo
echo "  LiteLLM URL: ${LITELLM_URL}"
echo "  Env file:    ${ENV_FILE}"
echo
echo "  Main:  systemctl status ${APP_NAME}"
echo "  Apps:  systemctl status ${APP_NAME}-apps"
echo "  Logs:  journalctl -u ${APP_NAME} -f"
echo "  CLI:   aios"
echo "  Web:   http://localhost:${LOCAL_PORT}"
echo
