import { readBody } from "../../shared/http/readBody.js";
import { json } from "../../shared/http/json.js";
import * as svc from "./service.js";

const respond = (res, result) => {
  if (result?.error) return json(res, { success: false, message: result.error }, result.status || 400);
  return json(res, { success: true, ...result });
};

const handleNotebookApi = async (req, res, path) => {
  if (path === "/apps/notebook/list" && req.method === "GET") {
    return json(res, { success: true, ...svc.list() });
  }
  if (path === "/apps/notebook/create" && req.method === "POST") {
    return respond(res, svc.create(await readBody(req)));
  }
  if (path === "/apps/notebook/update" && req.method === "POST") {
    return respond(res, svc.update(await readBody(req)));
  }
  if (path === "/apps/notebook/delete" && req.method === "POST") {
    return respond(res, svc.remove(await readBody(req)));
  }
  return false;
};

export { handleNotebookApi };
