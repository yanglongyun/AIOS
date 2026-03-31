import { readBody } from "../../shared/http/readBody.js";
import { json } from "../../shared/http/json.js";
import { countUsers } from "../../shared/auth/repository.js";
import { requestReload } from "../service/reload.js";
import { completeInstall } from "../service/system/install.js";
import { runReload } from "../service/system/reload.js";
const handleSystemApi = async (req, res, path) => {
  if (path === "/api/system/setup" && req.method === "GET") {
    return json(res, { success: true, initialized: countUsers() > 0 });
  }
  if (path === "/api/system/reload/request" && req.method === "POST") {
    const body = await readBody(req);
    requestReload({
      build: body.build ?? false,
      restart: body.restart || null,
      message: body.message || ""
    });
    return json(res, { success: true });
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
    const restart = body.restart === "apps" ? body.restart : null;
    try {
      await runReload(build, restart);
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
