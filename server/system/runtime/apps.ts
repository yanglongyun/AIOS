// @ts-nocheck
// 把主服务收到的 /apps/* 请求转发给应用服务。
import http from "http";

const APPS_PORT = Number(process.env.AGENT_APPS_PORT) || 9503;

const proxyApps = (req, res) => {
  const proxyReq = http.request(
    {
      host: "127.0.0.1",
      port: APPS_PORT,
      method: req.method,
      path: req.url,
      headers: req.headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );
  proxyReq.on("error", (error) => {
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    }
    res.end(JSON.stringify({ ok: false, error: `apps service unavailable: ${error.message}` }));
  });
  req.pipe(proxyReq);
};

export { proxyApps };
