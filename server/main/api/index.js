import { json } from "../../shared/http/json.js";
import { handleChatApi } from "./chat/index.js";
import { handleSettingsApi } from "./settings/index.js";
import { handleFsApi } from "./fs/index.js";
import { handleTaskApi } from "./task/index.js";
import { handleRuntimeApi } from "./runtime/index.js";
import { handleMemoryApi } from "./memory/index.js";
import { handleMonitorsApi } from "./monitors/index.js";

const handleApiRequest = async (req, res, url) => {
  const path = url.pathname;
  try {
    if (path === "/api/health") {
      json(res, { success: true });
      return true;
    }
    if (path.startsWith("/api/runtime/")) {
      await handleRuntimeApi(req, res, path);
      return true;
    }
    if (path.startsWith("/api/chat/")) {
      await handleChatApi(req, res, path, url);
      return true;
    }
    if (path.startsWith("/api/settings")) {
      await handleSettingsApi(req, res, path);
      return true;
    }
    if (path === "/api/fs" || path.startsWith("/api/fs/")) {
      await handleFsApi(req, res, path, url);
      return true;
    }
    if (path.startsWith("/api/task")) {
      await handleTaskApi(req, res, path, url);
      return true;
    }
    if (path.startsWith("/api/monitors")) {
      await handleMonitorsApi(req, res, path, url);
      return true;
    }
    if (path.startsWith("/api/memory/")) {
      await handleMemoryApi(req, res, path);
      return true;
    }
    json(res, { success: false, message: "API endpoint not found" }, 404);
    return true;
  } catch (error) {
    json(res, { success: false, message: error.message || "Internal server error" }, 500);
    return true;
  }
};
export {
  handleApiRequest
};
