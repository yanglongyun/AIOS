// @ts-nocheck
import { handleDebugShell } from "./shell.js";

const handleDebugApi = async (req, res, deps, path, method) => {
  const { sendJson } = deps;
  if (path === "/api/debug/shell" && method === "POST") {
    await handleDebugShell(req, res, deps);
    return;
  }
  sendJson(res, 404, { ok: false, error: "Not found" });
};

export { handleDebugApi };
