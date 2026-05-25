import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { createTrigger } from "../../service/triggers/create.js";
import { listTriggers } from "../../service/triggers/list.js";

const handleTriggersApi = async (req, res, path, url) => {
  if (path === "/api/triggers" && req.method === "GET") {
    return json(res, { success: true, items: listTriggers({ limit: url.searchParams.get("limit") || 100 }) });
  }
  if (path === "/api/triggers" && req.method === "POST") {
    const body = await readBody(req);
    return json(res, createTrigger(body));
  }
  return json(res, { success: false, message: "API endpoint not found" }, 404);
};

export {
  handleTriggersApi,
};
