import { resolve } from "path";
import { mkdirSync, writeFileSync } from "fs";
import { randomBytes } from "crypto";
import { extname } from "path";
import { readBody } from "../../shared/http/readBody.js";
import { json } from "../../shared/http/json.js";
import * as svc from "./service.js";

const UPLOAD_DIR = resolve(process.cwd(), "files", "apps", "notebook");
mkdirSync(UPLOAD_DIR, { recursive: true });

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

  // Image upload (multipart)
  if (path === "/apps/notebook/upload" && req.method === "POST") {
    const ctype = req.headers["content-type"] || "";
    const m = ctype.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!m) return json(res, { error: "缺少 multipart boundary" }, 400);

    const boundary = Buffer.from("--" + (m[1] || m[2]).trim());
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buf = Buffer.concat(chunks);

    let pos = 0;
    const files = [];
    while (pos < buf.length) {
      const start = buf.indexOf(boundary, pos);
      if (start < 0) break;
      pos = start + boundary.length;
      if (buf[pos] === 0x2d && buf[pos + 1] === 0x2d) break;
      pos += 2;
      const headerEnd = buf.indexOf(Buffer.from("\r\n\r\n"), pos);
      if (headerEnd < 0) break;
      const headers = buf.slice(pos, headerEnd).toString("utf8");
      pos = headerEnd + 4;
      const nextBoundary = buf.indexOf(boundary, pos);
      if (nextBoundary < 0) break;
      const body = buf.slice(pos, nextBoundary - 2);
      const fnameMatch = headers.match(/filename="([^"]*)"/i);
      if (fnameMatch && fnameMatch[1]) {
        const ext = extname(fnameMatch[1]).toLowerCase() || ".png";
        const name = randomBytes(12).toString("hex") + ext;
        const dest = resolve(UPLOAD_DIR, name);
        writeFileSync(dest, body);
        files.push({ name: fnameMatch[1], url: `/files/apps/notebook/${name}`, size: body.length });
      }
      pos = nextBoundary;
    }
    return json(res, { ok: true, files });
  }

  return false;
};

export { handleNotebookApi };
