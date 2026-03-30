import { readBody } from "../../shared/http/readBody.js";
import { json } from "../../shared/http/json.js";
import { countUsers } from "../../shared/auth/repository.js";
import { requestReload } from "../service/reload.js";
import { completeInstall } from "../service/system/install.js";
import { restartServerAfterResponse, runReload } from "../service/system/reload.js";
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
      return json(res, { success: false, message: "\u7CFB\u7EDF\u672A\u521D\u59CB\u5316" }, 400);
    }
    const body = await readBody(req);
    const language = body.language === "zh" || body.language === "en" ? body.language : "";
    if (!language) {
      return json(res, { success: false, message: "\u8BED\u8A00\u4E0D\u5408\u6CD5" }, 400);
    }
    try {
      completeInstall(language);
      return json(res, { success: true });
    } catch (e) {
      return json(res, { success: false, message: e instanceof Error ? e.message : "\u5B89\u88C5\u5B8C\u6210\u5931\u8D25" }, 500);
    }
  }
  if (path === "/api/system/reload" && req.method === "POST") {
    const body = await readBody(req);
    const build = body.build === true;
    const restart = body.restart === "server" || body.restart === "apps" || body.restart === "both" ? body.restart : null;
    try {
      const restartServer = await runReload(build, restart);
      if (restartServer) {
        json(res, { success: true });
        await restartServerAfterResponse();
        return;
      }
      json(res, { success: true });
    } catch (e) {
      json(res, { success: false, message: e instanceof Error ? e.message : "\u7CFB\u7EDF\u91CD\u8F7D\u5931\u8D25" }, 500);
    }
    return;
  }
  json(res, { error: "API endpoint not found" }, 404);
};
export {
  handleSystemApi
};
