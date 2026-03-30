import { createHash, randomBytes } from "crypto";
import { parseCookieHeader, serializeCookie } from "../http/cookie.js";
const SESSION_COOKIE_NAME = "aios_session";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const generateSessionToken = () => randomBytes(32).toString("hex");
const hashSessionToken = (token) => createHash("sha256").update(String(token || "")).digest("hex");
const getSessionTokenFromRequest = (req) => {
  const cookies = parseCookieHeader(req?.headers?.cookie || "");
  return cookies[SESSION_COOKIE_NAME] || "";
};
const buildSessionCookie = (token) => serializeCookie(SESSION_COOKIE_NAME, token, {
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
  httpOnly: true,
  sameSite: "Lax"
});
const buildClearSessionCookie = () => serializeCookie(SESSION_COOKIE_NAME, "", {
  path: "/",
  maxAge: 0,
  httpOnly: true,
  sameSite: "Lax"
});
export {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  buildClearSessionCookie,
  buildSessionCookie,
  generateSessionToken,
  getSessionTokenFromRequest,
  hashSessionToken
};
