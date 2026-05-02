import { readBody } from "../../shared/http/readBody.js";
import { json } from "../../shared/http/json.js";
import * as svc from "./service.js";

const respond = (res, result) => {
  if (result?.error) return json(res, { error: result.error }, result.status || 400);
  return json(res, result);
};

const handleNotebookApi = async (req, res, path) => {
  // Folders
  if (path === "/apps/notebook/folders/list" && req.method === "GET") {
    return json(res, svc.listFolders());
  }
  if (path === "/apps/notebook/folders/create" && req.method === "POST") {
    return respond(res, svc.createFolder(await readBody(req)));
  }
  if (path === "/apps/notebook/folders/update" && req.method === "POST") {
    return respond(res, svc.updateFolder(await readBody(req)));
  }
  if (path === "/apps/notebook/folders/delete" && req.method === "POST") {
    return respond(res, svc.removeFolder(await readBody(req)));
  }

  // Notes
  if (path === "/apps/notebook/list" && req.method === "GET") {
    const url = new URL(req.url, "http://localhost");
    const folderId = url.searchParams.get("folderId");
    return json(res, svc.listNotes({ folderId }));
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
  if (path === "/apps/notebook/polish" && req.method === "POST") {
    return respond(res, await svc.polish(await readBody(req)));
  }
  return false;
};

export { handleNotebookApi };
