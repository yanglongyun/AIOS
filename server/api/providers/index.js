import { json } from "../../../shared/http/json.js";
import { authorize, poll, refresh, disconnect, manualTokens } from "./openai.js";

const handleProvidersApi = async (req, res, path) => {
  if (path === "/api/providers/openai/authorize" && req.method === "GET") return authorize(req, res);
  if (path === "/api/providers/openai/poll" && req.method === "POST") return poll(req, res);
  if (path === "/api/providers/openai/refresh" && req.method === "POST") return refresh(req, res);
  if (path === "/api/providers/openai/disconnect" && req.method === "POST") return disconnect(req, res);
  if (path === "/api/providers/openai/manual-tokens" && req.method === "POST") return manualTokens(req, res);
  return json(res, { success: false, message: "API endpoint not found" }, 404);
};

export {
  handleProvidersApi
};
