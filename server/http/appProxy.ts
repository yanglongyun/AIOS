// 应用子域名反代。
//
// 应用契约要求「每个 app 一个真 origin」(不用路径前缀挂载,否则 href="/style.css" 这类绝对路径会 404)。
// 本机时真 origin 就是 http://127.0.0.1:<端口>;服务器上浏览器够不着 127.0.0.1,
// 所以由宿主按子域名转发:<appId>.<AIOS_APP_DOMAIN> → 127.0.0.1:<app 端口>。
//
// 配置:AIOS_APP_DOMAIN=aios.example.com(需要泛解析 *.aios.example.com 到本机),
// 没有域名时可用 sslip.io:AIOS_APP_DOMAIN=47-236-196-138.sslip.io,无需任何 DNS 设置。
// 此时 AIOS 本身也要从 http://<AIOS_APP_DOMAIN>:<端口> 打开,登录 cookie 才能覆盖到应用子域名。
import http from "node:http";
import net from "node:net";
import type { Duplex } from "node:stream";
import { getApp } from "../apps/registry.js";
import { ensureApp } from "../apps/supervisor.js";
import { isAuthenticated } from "./auth.js";
import { appDomain } from "./domain.js";


/** Host 头 → app id;不是应用子域名返回 "" */
const appIdOf = (req: http.IncomingMessage) => {
  const domain = appDomain();
  if (!domain) return "";
  const host = String(req.headers.host || "").toLowerCase().replace(/:\d+$/, "");
  if (!host.endsWith(`.${domain}`)) return "";
  const id = host.slice(0, -domain.length - 1);
  return id && !id.includes(".") && getApp(id) ? id : "";
};

/** 应用对外地址:配了子域名就用子域名,否则只能本机访问的 127.0.0.1。 */
export const publicAppOrigin = (req: http.IncomingMessage, appId: string, port: number) => {
  const domain = appDomain();
  if (!domain) return `http://127.0.0.1:${port}`;
  const proto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() || "http";
  const hostPort = String(req.headers["x-forwarded-host"] || req.headers.host || "").match(/:(\d+)$/)?.[1];
  return `${proto}://${appId}.${domain}${hostPort ? `:${hostPort}` : ""}`;
};

const unauthorized = (res: http.ServerResponse) => {
  res.writeHead(401, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("未登录 AIOS:请先打开 AIOS 主页登录。\n");
};

/** 返回 true = 这个请求是应用子域名的,已经处理。 */
export const handleAppProxy = async (req: http.IncomingMessage, res: http.ServerResponse) => {
  const appId = appIdOf(req);
  if (!appId) return false;
  if (!isAuthenticated(req)) { unauthorized(res); return true; }
  let port: number;
  try { port = (await ensureApp(appId)).port; }
  catch (error: any) {
    res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`应用 ${appId} 起不来:${error?.message || error}\n`);
    return true;
  }
  const upstream = http.request({
    host: "127.0.0.1", port, method: req.method, path: req.url,
    headers: { ...req.headers, host: `127.0.0.1:${port}` },
  }, (reply) => {
    res.writeHead(reply.statusCode || 502, reply.headers);
    reply.pipe(res);
  });
  upstream.on("error", (error) => {
    if (!res.headersSent) res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`应用 ${appId} 无响应:${error.message}\n`);
  });
  req.pipe(upstream);
  return true;
};

/** WebSocket 升级:应用子域名的转发给应用;返回 true = 已处理(调用方别再管这个 socket)。 */
export const handleAppProxyUpgrade = (req: http.IncomingMessage, socket: Duplex, head: Buffer) => {
  const appId = appIdOf(req);
  if (!appId) return false;
  if (!isAuthenticated(req)) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return true;
  }
  void ensureApp(appId).then(({ port }) => {
    const upstream = net.connect(port, "127.0.0.1", () => {
      const lines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`];
      for (let i = 0; i < req.rawHeaders.length; i += 2) {
        const key = req.rawHeaders[i];
        lines.push(`${key}: ${key.toLowerCase() === "host" ? `127.0.0.1:${port}` : req.rawHeaders[i + 1]}`);
      }
      upstream.write(lines.join("\r\n") + "\r\n\r\n");
      if (head?.length) upstream.write(head);
      upstream.pipe(socket);
      socket.pipe(upstream);
    });
    upstream.on("error", () => socket.destroy());
    socket.on("error", () => upstream.destroy());
  }).catch(() => socket.destroy());
  return true;
};
