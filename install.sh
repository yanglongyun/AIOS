#!/usr/bin/env bash
# AIOS 一键安装(Linux,systemd)。用法:
#   curl -fsSL https://raw.githubusercontent.com/yanglongyun/AIOS/main/install.sh | sudo bash
# 可选环境变量:AIOS_PASSWORD AIOS_PORT AIOS_APP_DOMAIN AIOS_REF(分支,默认 main)AIOS_DIR(代码目录,默认 /opt/aios)
set -euo pipefail

REF="${AIOS_REF:-main}"
DIR="${AIOS_DIR:-/opt/aios}"
PORT="${AIOS_PORT:-9500}"
NODE_VERSION="v22.22.0"

[ "$(id -u)" = 0 ] || { echo "请用 root 或 sudo 运行" >&2; exit 1; }
command -v git >/dev/null || { apt-get update -y && apt-get install -y git curl xz-utils || yum install -y git curl xz; }

node_ok() { command -v node >/dev/null && node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=18)?0:1)'; }
if ! node_ok; then
  echo "==> 安装 Node.js $NODE_VERSION"
  arch=$(uname -m); case "$arch" in x86_64) arch=x64;; aarch64) arch=arm64;; esac
  curl -fL "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-$arch.tar.xz" -o /tmp/node.tar.xz \
    || curl -fL "https://npmmirror.com/mirrors/node/$NODE_VERSION/node-$NODE_VERSION-linux-$arch.tar.xz" -o /tmp/node.tar.xz
  tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 && rm -f /tmp/node.tar.xz
fi
echo "==> Node $(node -v)"

echo "==> 获取代码到 $DIR"
if [ -d "$DIR/.git" ]; then git -C "$DIR" fetch origin "$REF" && git -C "$DIR" checkout -q "$REF" && git -C "$DIR" pull -q --ff-only origin "$REF"
else git clone -q --branch "$REF" https://github.com/yanglongyun/AIOS.git "$DIR"; fi

echo "==> 安装依赖并构建"
cd "$DIR" && npm install --no-audit --no-fund && npm run build

ENV_FILE=/etc/aios.env
if [ ! -f "$ENV_FILE" ]; then
  {
    echo "AIOS_PORT=$PORT"
    [ -n "${AIOS_PASSWORD:-}" ] && echo "AIOS_PASSWORD=$AIOS_PASSWORD"
    [ -n "${AIOS_APP_DOMAIN:-}" ] && echo "AIOS_APP_DOMAIN=$AIOS_APP_DOMAIN"
  } > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
fi

cat > /etc/systemd/system/aios.service <<UNIT
[Unit]
Description=AIOS
After=network.target

[Service]
WorkingDirectory=$DIR
EnvironmentFile=$ENV_FILE
Environment=PATH=/usr/local/bin:/usr/bin:/bin
ExecStart=$(command -v npm) start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload && systemctl enable aios >/dev/null 2>&1 && systemctl restart aios

sleep 5
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
echo
echo "✅ AIOS 已启动: http://$IP:$PORT"
if [ -z "${AIOS_PASSWORD:-}" ] && [ -f /root/.aios/initial-password.txt ]; then
  echo "   初始密码: $(cat /root/.aios/initial-password.txt)"
fi
echo "   日志: journalctl -u aios -f    配置: $ENV_FILE"
echo "   云服务器记得在安全组放行 $PORT 端口"
