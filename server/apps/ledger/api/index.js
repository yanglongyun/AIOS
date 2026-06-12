// @ts-nocheck
// 记账本 HTTP 层:method/路径分发、参数校验,调 service。
import { readBody, sendJson, parseJson } from "../../shared/http.js";
import {
  initDb,
  CATEGORIES,
  listEntries,
  summary,
  getBudget,
  setBudget,
  createEntry,
  updateEntry,
  deleteEntry,
  parseEntry,
  smartRecord,
} from "../service/index.js";

const match = (path) => path.startsWith("/apps/ledger/");

const handleApi = async (req, res, path, url) => {
  initDb();
  if (path === "/apps/ledger/meta") {
    if (req.method !== "GET") return false;
    sendJson(res, 200, { ok: true, categories: CATEGORIES, budget: getBudget() });
    return true;
  }
  if (path === "/apps/ledger/budget") {
    if (req.method !== "PUT") return false;
    const body = parseJson(await readBody(req));
    sendJson(res, 200, { ok: true, budget: setBudget(body.amount) });
    return true;
  }
  if (path === "/apps/ledger/smart") {
    if (req.method !== "POST") return false;
    const body = parseJson(await readBody(req));
    sendJson(res, 200, { ok: true, ...(await smartRecord(body)) });
    return true;
  }
  if (path === "/apps/ledger/parse") {
    if (req.method !== "POST") return false;
    const body = parseJson(await readBody(req));
    sendJson(res, 200, { ok: true, ...(await parseEntry(body)) });
    return true;
  }

  if (path !== "/apps/ledger/entries") return false;
  const id = url.searchParams.get("id");
  const month = url.searchParams.get("month") || "";

  if (req.method === "GET") {
    sendJson(res, 200, { ok: true, entries: listEntries(month), summary: summary(month) });
    return true;
  }
  if (req.method === "POST") {
    const body = parseJson(await readBody(req));
    sendJson(res, 201, { ok: true, entry: createEntry(body), summary: summary(month) });
    return true;
  }
  if (req.method === "PATCH") {
    if (!id) return sendJson(res, 400, { ok: false, error: "id is required" });
    const entry = updateEntry(id, parseJson(await readBody(req)));
    if (!entry) return sendJson(res, 404, { ok: false, error: "entry not found" });
    sendJson(res, 200, { ok: true, entry, summary: summary(month) });
    return true;
  }
  if (req.method === "DELETE") {
    if (!id) return sendJson(res, 400, { ok: false, error: "id is required" });
    deleteEntry(id);
    sendJson(res, 200, { ok: true, summary: summary(month) });
    return true;
  }
  return false;
};

export { match, handleApi, initDb };
