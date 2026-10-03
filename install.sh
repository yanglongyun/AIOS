#!/usr/bin/env bash
# AIOS 一键安装(Linux,systemd)。用法:
#   curl -fsSL https://raw.githubusercontent.com/yanglongyun/AIOS/main/install.sh | sudo bash
# 可选环境变量:
#   AIOS_PASSWORD AIOS_PORT AIOS_APP_DOMAIN
#   AIOS_REF      分支,默认 main
#   AIOS_DIR      代码目录,默认 /opt/aios
#   AIOS_BROWSER  0 = 不装 Chrome(browser 工具需要它),默认装
#   AIOS_DESKTOP  1 = 装图形桌面 + 远程桌面(AIOS 里的「桌面」应用;computer 工具需要它,浏览器也变成看得见的)
set -euo pipefail

REF="${AIOS_REF:-main}"
DIR="${AIOS_DIR:-/opt/aios}"
PORT="${AIOS_PORT:-80}"
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

apt_install() { DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends "$@"; }

if [ "${AIOS_BROWSER:-1}" != 0 ] && ! command -v google-chrome >/dev/null && ! command -v chromium >/dev/null && command -v apt-get >/dev/null; then
  echo "==> 安装浏览器"
  apt-get update -y >/dev/null
  if [ "$(uname -m)" = x86_64 ] && curl -fL https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb -o /tmp/chrome.deb; then
    apt_install /tmp/chrome.deb && rm -f /tmp/chrome.deb
  else
    apt_install chromium || apt_install chromium-browser || echo "!! 浏览器没装上,browser 工具暂不可用"
  fi
  apt_install fonts-noto-cjk || true
fi
# 发给模型的图片要先压缩(ImageMagick)
command -v convert >/dev/null || command -v magick >/dev/null || { command -v apt-get >/dev/null && apt_install imagemagick || true; }

DESKTOP_ENV=""
if [ "${AIOS_DESKTOP:-0}" = 1 ] && command -v apt-get >/dev/null; then
  echo "==> 安装图形桌面与网页远程桌面"
  apt-get update -y >/dev/null
  apt_install xfce4 xfce4-terminal dbus-x11 x11-xserver-utils tigervnc-standalone-server tigervnc-tools \
    novnc websockify xdotool imagemagick fonts-noto-cjk
  # VNC 和 websockify 都只听本机;对外由 AIOS 在 80 端口的 /desktop/ 转发,走 AIOS 的登录,所以 VNC 不设密码
  cat > /etc/systemd/system/aios-vnc.service <<UNIT
[Unit]
Description=AIOS 虚拟显示器 (:1)
After=network.target
[Service]
ExecStartPre=-/bin/rm -f /tmp/.X1-lock /tmp/.X11-unix/X1
ExecStart=/usr/bin/Xtigervnc :1 -geometry 1600x900 -depth 24 -rfbport 5901 -localhost yes -SecurityTypes None -AlwaysShared
Restart=always
[Install]
WantedBy=multi-user.target
UNIT
  cat > /etc/systemd/system/aios-xfce.service <<UNIT
[Unit]
Description=AIOS 桌面 (Xfce)
After=aios-vnc.service
Requires=aios-vnc.service
[Service]
Environment=DISPLAY=:1
ExecStartPre=/bin/sleep 2
ExecStart=/usr/bin/dbus-launch --exit-with-session /usr/bin/startxfce4
Restart=always
[Install]
WantedBy=multi-user.target
UNIT
  cat > /etc/systemd/system/aios-novnc.service <<UNIT
[Unit]
Description=AIOS 远程桌面网关 (127.0.0.1:6080)
After=aios-vnc.service
[Service]
ExecStart=/usr/bin/websockify --web /usr/share/novnc 127.0.0.1:6080 127.0.0.1:5901
Restart=always
[Install]
WantedBy=multi-user.target
UNIT
  systemctl daemon-reload
  for s in aios-vnc aios-xfce aios-novnc; do systemctl enable "$s" >/dev/null 2>&1; systemctl restart "$s"; done
  DESKTOP_ENV="AIOS_DISPLAY=:1"
fi

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
if [ -n "$DESKTOP_ENV" ] && ! grep -q '^AIOS_DISPLAY=' "$ENV_FILE"; then echo "$DESKTOP_ENV" >> "$ENV_FILE"; fi

cat > /etc/systemd/system/aios.service <<UNIT
[Unit]
Description=AIOS
After=network.target aios-vnc.service

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
if [ -n "$DESKTOP_ENV" ]; then
  echo "   远程桌面: 在 AIOS 右上角应用中心打开「桌面」"
fi
echo "   日志: journalctl -u aios -f    配置: $ENV_FILE"
echo "   云服务器记得在安全组放行 $PORT 端口"
