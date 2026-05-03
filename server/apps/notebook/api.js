import { readBody } from "../../shared/http/readBody.js";
import { json } from "../../shared/http/json.js";
import * as svc from "./service.js";

const respond = (res, result) => {
  if (result?.error) return json(res, { error: result.error }, result.status || 400);
  return json(res, result);
};

const handleNotebookApi = async (req, res, path) => {
  if (path === "/apps/notebook/list" && req.method === "GET") {
    return json(res, svc.listNotes());
  }
  if (path === "/apps/notebook/create" && req.method === "POST") {
    return respond(res, svc.createNote(await readBody(req)));
  }
  if (path === "/apps/notebook/update" && req.method === "POST") {
    return respond(res, svc.updateNote(await readBody(req)));
  }
  if (path === "/apps/notebook/delete" && req.method === "POST") {
    return respond(res, svc.removeNote(await readBody(req)));
  }
  if (path === "/apps/notebook/ai/title" && req.method === "POST") {
    return respond(res, await svc.aiGenerateTitle(await readBody(req)));
  }
  if (path === "/apps/notebook/ai/summary" && req.method === "POST") {
    return respond(res, await svc.aiGenerateSummary(await readBody(req)));
  }
  if (path === "/apps/notebook/ai/polish" && req.method === "POST") {
    return respond(res, await svc.aiPolish(await readBody(req)));
  }
  return false;
};

export { handleNotebookApi };
