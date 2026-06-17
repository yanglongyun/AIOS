// @ts-nocheck
import {
  createMemory,
  deleteMemory,
  getMemory,
  listMemories,
  searchMemories,
  updateMemory,
} from "../service/memories/index.js";
import { readJsonBody } from "../utils/http.js";

const readLimit = (value, fallback = 200) => Math.max(1, Math.min(500, Number.parseInt(value, 10) || fallback));
const readUserId = (url) => url.searchParams.get("userId") || url.searchParams.get("user_id") || "default";

const handleMemoriesApi = async (req, res, { sendJson }, path, method, url) => {
  if (path === "/api/memories/search" && method === "GET") {
    sendJson(res, 200, {
      ok: true,
      memories: searchMemories({
        userId: readUserId(url),
        query: url.searchParams.get("q") || url.searchParams.get("query") || "",
        limit: readLimit(url.searchParams.get("limit"), 20),
      }),
    });
    return;
  }

  if (path === "/api/memories/get" && method === "GET") {
    const memory = getMemory({ id: url.searchParams.get("id"), userId: readUserId(url) });
    if (!memory) {
      sendJson(res, 404, { ok: false, error: "memory not found" });
      return;
    }
    sendJson(res, 200, { ok: true, memory });
    return;
  }

  if (path !== "/api/memories") {
    sendJson(res, 404, { error: "API endpoint not found" });
    return;
  }

  if (method === "GET") {
    const id = url.searchParams.get("id");
    if (id) {
      const memory = getMemory({ id, userId: readUserId(url) });
      if (!memory) {
        sendJson(res, 404, { ok: false, error: "memory not found" });
        return;
      }
      sendJson(res, 200, { ok: true, memory });
      return;
    }
    sendJson(res, 200, {
      ok: true,
      memories: listMemories({
        userId: readUserId(url),
        visibility: url.searchParams.get("visibility") || "",
        limit: readLimit(url.searchParams.get("limit")),
      }),
    });
    return;
  }

  if (method === "POST") {
    const body = await readJsonBody(req);
    sendJson(res, 201, { ok: true, memory: createMemory(body) });
    return;
  }

  if (method === "PATCH") {
    const id = url.searchParams.get("id");
    if (!id) {
      sendJson(res, 400, { ok: false, error: "Missing memory id" });
      return;
    }
    const body = await readJsonBody(req);
    const memory = updateMemory({ id, userId: readUserId(url), ...body });
    if (!memory) {
      sendJson(res, 404, { ok: false, error: "memory not found" });
      return;
    }
    sendJson(res, 200, { ok: true, memory });
    return;
  }

  if (method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) {
      sendJson(res, 400, { ok: false, error: "Missing memory id" });
      return;
    }
    sendJson(res, 200, { ok: true, deleted: deleteMemory({ id, userId: readUserId(url) }) });
    return;
  }

  sendJson(res, 404, { error: "API endpoint not found" });
};

export { handleMemoriesApi };
