import { countUsers, deleteAllAuthSessions } from "./repository.js";
import { getAuthUser } from "./guard.js";
const normalizeUsername = (value) => String(value || "").trim().toLowerCase();
const isLoopbackIp = (ip) => {
  const value = String(ip || "").trim();
  return value === "127.0.0.1" || value === "::1" || value === "::ffff:127.0.0.1";
};
const firstForwardedIp = (req) => {
  const raw = String(req?.headers?.["x-forwarded-for"] || "").trim();
  if (!raw) return "";
  return raw.split(",")[0].trim();
};
const isTrustedLocalRequest = (req) => {
  const forwarded = firstForwardedIp(req);
  if (forwarded) return false;
  return isLoopbackIp(req?.socket?.remoteAddress || "");
};
const localActor = () => {
  return {
    id: 0,
    username: "local-runtime",
    role: "system",
    internal: true
  };
};
const allowServerPublic = (path, method) => {
  return path === "/api/health" || path.startsWith("/api/auth/") || path === "/api/system/setup";
};
const allowServerDuringSetup = (path, method) => {
  return path === "/api/settings" && (method === "GET" || method === "POST") || path === "/api/task/create/instant" && method === "POST" || path === "/api/task/create/agent" && method === "POST";
};
const allowAppsPublic = (path) => {
  return path === "/apps/health";
};
const access = (req, path, method, scope) => {
  const initialized = countUsers() > 0;
  if (!initialized) deleteAllAuthSessions();
  if (scope === "server-api") {
    if (isTrustedLocalRequest(req)) {
      return { ok: true, initialized, user: localActor() };
    }
    if (allowServerPublic(path, method)) {
      return { ok: true, initialized, user: null };
    }
    if (!initialized && !allowServerDuringSetup(path, method)) {
      return { ok: false, status: 423, message: "\u7CFB\u7EDF\u672A\u521D\u59CB\u5316\uFF0C\u8BF7\u5148\u5B8C\u6210\u6B22\u8FCE\u5B89\u88C5\u6D41\u7A0B" };
    }
    if (!initialized && allowServerDuringSetup(path, method)) {
      return { ok: true, initialized, user: null };
    }
    const user = getAuthUser(req);
    if (!user) return { ok: false, status: 401, message: "\u672A\u767B\u5F55" };
    return { ok: true, initialized, user };
  }
  if (scope === "apps") {
    if (isTrustedLocalRequest(req)) {
      return { ok: true, initialized, user: localActor() };
    }
    if (allowAppsPublic(path)) return { ok: true, initialized, user: null };
    if (!initialized) {
      return { ok: false, status: 423, message: "\u7CFB\u7EDF\u672A\u521D\u59CB\u5316\uFF0C\u8BF7\u5148\u5B8C\u6210\u6B22\u8FCE\u5B89\u88C5\u6D41\u7A0B" };
    }
    const user = getAuthUser(req);
    if (!user) return { ok: false, status: 401, message: "\u672A\u767B\u5F55" };
    return { ok: true, initialized, user };
  }
  return { ok: true, initialized, user: null };
};
export {
  access,
  normalizeUsername
};
