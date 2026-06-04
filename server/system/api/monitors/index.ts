// @ts-nocheck
import { handleMonitorsGet } from "./get.js";
import { handleMonitorPost } from "./post.js";

const handleMonitorsApi = async (req, res, deps, path, method, url) => {
  const { sendJson } = deps;
  if (path !== "/api/monitors") {
    sendJson(res, 404, { ok: false, error: "Not found" });
    return;
  }
  if (method === "GET") {
    await handleMonitorsGet(req, res, deps, url);
    return;
  }
  if (method === "POST") {
    await handleMonitorPost(req, res, deps);
    return;
  }
  sendJson(res, 404, { ok: false, error: "Not found" });
};

export { handleMonitorsApi };
