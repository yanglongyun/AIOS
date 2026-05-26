import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { createMonitor } from "../../service/monitors/create.js";
import { listMonitors } from "../../service/monitors/list.js";

const handleMonitorsApi = async (req, res, path, url) => {
  if (path === "/api/monitors" && req.method === "GET") {
    return json(res, { success: true, items: listMonitors({ limit: url.searchParams.get("limit") || 100 }) });
  }
  if (path === "/api/monitors" && req.method === "POST") {
    const body = await readBody(req);
    return json(res, createMonitor(body));
  }
  return json(res, { success: false, message: "API endpoint not found" }, 404);
};

export {
  handleMonitorsApi,
};
