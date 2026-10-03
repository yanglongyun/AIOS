// 远程桌面:把 /desktop/* 转给本机的 noVNC(websockify),走 AIOS 的 80 端口和登录。
//
//   浏览器 ──/desktop/vnc.html──────▶ AIOS ──▶ 127.0.0.1:6080/vnc.html   (noVNC 网页)
//   浏览器 ──ws /desktop/websockify──▶ AIOS ──▶ 127.0.0.1:6080/websockify (VNC 画面)
//
// websockify 和 VNC 都只听本机,对外只有 AIOS 一个口子,没登录连页面都拿不到 ——
// 所以 VNC 自己不设密码。noVNC 的资源全是相对路径,挂在子路径下没问题。
import http from "node:http";
import net from "node:net";
import type { Duplex } from "node:stream";
import { isAuthenticated } from "./auth.js";

const PREFIX = "/desktop/";
const port = () => Number(process.env.AIOS_DESKTOP_PORT) || 6080;

const isDesktopPath = (url = "") => url === "/desktop" || url.startsWith(PREFIX);
const strip = (url = "") => url.slice("/desktop".length) || "/";

/** 桌面是否在线(给界面判断显示「桌面」还是安装说明)。 */
export const desktopAvailable = () => new Promise<boolean>((resolve) => {
  const socket = net.connect(port(), "127.0.0.1");
  const done = (ok: boolean) => { socket.destroy(); resolve(ok); };
  socket.setTimeout(800, () => done(false));
  socket.once("connect", () => done(true));
  socket.once("error", () => done(false));
});

/** 返回 true = 已处理。 */
export const handleDesktopProxy = (req: http.IncomingMessage, res: http.ServerResponse) => {
  if (!isDesktopPath(req.url)) return false;
  if (!isAuthenticated(req)) {
    res.writeHead(401, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("未登录 AIOS\n");
    return true;
  }
  if (req.url === "/desktop") { res.writeHead(302, { Location: PREFIX }); res.end(); return true; }
  const upstream = http.request({
    host: "127.0.0.1", port: port(), method: req.method, path: strip(req.url),
    headers: { ...req.headers, host: `127.0.0.1:${port()}` },
  }, (reply) => {
    res.writeHead(reply.statusCode || 502, reply.headers);
    reply.pipe(res);
  });
  upstream.on("error", () => {
    if (!res.headersSent) res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("远程桌面没有运行。安装时加 AIOS_DESKTOP=1 装上桌面。\n");
  });
  req.pipe(upstream);
  return true;
};

/** WebSocket 升级(/desktop/websockify)。返回 true = 已处理。 */
export const handleDesktopUpgrade = (req: http.IncomingMessage, socket: Duplex, head: Buffer) => {
  if (!isDesktopPath(req.url)) return false;
  if (!isAuthenticated(req)) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return true;
  }
  const upstream = net.connect(port(), "127.0.0.1", () => {
    const lines = [`${req.method} ${strip(req.url)} HTTP/${req.httpVersion}`];
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const key = req.rawHeaders[i];
      if (key.toLowerCase() === "origin") continue; // websockify 不认外面的 Origin,本机转发不需要它
      lines.push(`${key}: ${key.toLowerCase() === "host" ? `127.0.0.1:${port()}` : req.rawHeaders[i + 1]}`);
    }
    upstream.write(lines.join("\r\n") + "\r\n\r\n");
    if (head?.length) upstream.write(head);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });
  upstream.on("error", () => socket.destroy());
  socket.on("error", () => upstream.destroy());
  return true;
};
