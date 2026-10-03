import http from "http";
import { handleApi } from "./http/api/index.js";
import { attachWs } from "./http/ws.js";
import { serve } from "./http/static.js";
import { startWatcher } from "./files/watcher.js";
import { handleAuthRoutes, initAuth, isAuthenticated, isSameOrigin } from "./http/auth.js";
import { handleAppProxy, handleAppProxyUpgrade } from "./http/appProxy.js";
import { seedPresetSkills } from "./skills/registry.js";
import { seedPresetApps, watchApps } from "./apps/registry.js";
import { startAlwaysApps } from "./apps/supervisor.js";

const forbidden = (res: http.ServerResponse, code: number, error: string) => {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ ok: false, error }));
};

const startServer = async (port = 80, host = "0.0.0.0") =>
  new Promise((resolve, reject) => {
    initAuth();
    const server = http.createServer(async (req, res) => {
      // 应用子域名(<id>.<AIOS_APP_DOMAIN>):整站反代给应用进程,应用自己负责它的页面
      if (await handleAppProxy(req, res)) return;

      const url = new URL(req.url || "/", "http://localhost");
      const method = String(req.method || "GET").toUpperCase();
      // 跨站写保护:带副作用的方法必须同源
      if (method !== "GET" && method !== "HEAD" && !isSameOrigin(req)) return forbidden(res, 403, "forbidden origin");
      if (await handleAuthRoutes(req, res, url.pathname, method)) return;
      // /api/*(登录接口除外)都要登录;/apps/* 是应用回调宿主,走应用自己的 token;静态页面放行(界面里有登录页)
      if (url.pathname.startsWith("/api/") && !isAuthenticated(req)) return forbidden(res, 401, "未登录");

      const result = await handleApi(req, res);
      if (result === null) serve(res, url.pathname);
    });
    server.on("upgrade", (req, socket, head) => {
      if (!handleAppProxyUpgrade(req, socket, head)) return;
    });
    attachWs(server);
    server.listen(port, host, () => {
      startWatcher();          // 常用目录文件监听:磁盘上的任何变化 → 树自动刷新
      seedPresetApps();        // 出厂应用落地到应用的家 —— 之后就是用户自己的 app
      seedPresetSkills();      // 出厂技能落地到 ~/.aios/skills
      watchApps();             // 应用目录监听:AI 刚写完一个 app,刷新就出现在列表里
      void startAlwaysApps();  // run.mode: "always" 的应用随宿主拉起(其余按需)
      console.log(`🌱  AIOS running on http://${host === "0.0.0.0" ? "<本机IP>" : host}:${port}`);
      resolve(server);
    });
    server.on("error", reject);
  });

export { startServer };
