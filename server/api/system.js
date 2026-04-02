import { readBody } from "../../shared/http/readBody.js";
import { json } from "../../shared/http/json.js";
import { countUsers } from "../../shared/auth/repository.js";
import { completeInstall } from "../service/system/install.js";
import { requestReload, runReload } from "../service/system/reload.js";
import { runReloadTest } from "../service/system/test.js";
const handleSystemApi = async (req, res, path) => {
  if (path === "/api/system/setup" && req.method === "GET") {
    return json(res, { success: true, initialized: countUsers() > 0 });
  }
  if (path === "/api/system/reload/request" && req.method === "POST") {
    const body = await readBody(req);
    const build = body.build ?? false;
    const restartApps = body.restartApps === true || body.restart === "apps";
    const restartServer = body.restartServer === true;
    try {
      await runReloadTest(build, restartApps, restartServer);
      requestReload({
        build,
        restartApps,
        restartServer,
        message: body.message || ""
      });
      return json(res, { success: true, tested: true });
    } catch (e) {
      return json(res, { success: false, message: e instanceof Error ? e.message : "系统预检失败" }, 500);
    }
  }
  if (path === "/api/system/reload/test" && req.method === "POST") {
    const body = await readBody(req);
    const build = body.build === true;
    const restartApps = body.restartApps === true || body.restart === "apps";
    const restartServer = body.restartServer === true;
    try {
      await runReloadTest(build, restartApps, restartServer);
      return json(res, { success: true });
    } catch (e) {
      return json(res, { success: false, message: e instanceof Error ? e.message : "系统预检失败" }, 500);
    }
  }
  if (path === "/api/system/install/complete" && req.method === "POST") {
    if (countUsers() === 0) {
      return json(res, { success: false, message: "系统未初始化" }, 400);
    }
    const body = await readBody(req);
    const language = body.language === "zh" || body.language === "en" ? body.language : "";
    if (!language) {
      return json(res, { success: false, message: "语言不合法" }, 400);
    }
    try {
      completeInstall(language);
      return json(res, { success: true });
    } catch (e) {
      return json(res, { success: false, message: e instanceof Error ? e.message : "安装完成失败" }, 500);
    }
  }
  if (path === "/api/system/reload" && req.method === "POST") {
    const body = await readBody(req);
    const build = body.build === true;
    const restartApps = body.restartApps === true || body.restart === "apps";
    const restartServer = body.restartServer === true;
    try {
      await runReload(build, restartApps, restartServer, { defer: restartApps || restartServer, delayMs: 300 });
      json(res, { success: true });
    } catch (e) {
      json(res, { success: false, message: e instanceof Error ? e.message : "系统重载失败" }, 500);
    }
    return;
  }
  json(res, { error: "API endpoint not found" }, 404);
};
export {
  handleSystemApi
};
