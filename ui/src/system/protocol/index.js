import { windowManager } from "../../stores/windowManager.js";

const normalizePayload = (payload = {}) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Protocol payload must be an object");
  }
  const app = String(payload.app || "").trim();
  if (!app) {
    throw new Error("Protocol payload must include app");
  }
  return {
    action: String(payload.action || "open").trim(),
    app,
    data: payload.data && typeof payload.data === "object" && !Array.isArray(payload.data) ? payload.data : {}
  };
};

const openProtocol = async (payload) => {
  return windowManager.openByProtocol(normalizePayload(payload));
};

export {
  normalizePayload,
  openProtocol
};
