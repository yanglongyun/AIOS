// 登录门卫。AIOS 跑在服务器上、经公网访问,所以除了 /health、登录接口和静态页面,
// 一切 /api/* 与 /api/ws 都要求已登录。
//
// 密码:
//   - 启动时有 AIOS_PASSWORD 环境变量 → 用它(每次启动都以它为准);
//   - 否则首次启动随机生成一个,打印到控制台并写进 <DATA_HOME>/initial-password.txt;
//   - 用户可在「设置」里改,改完 initial-password.txt 删除。
// 会话:签名 cookie(HMAC,密钥存在 auth.json),服务重启不掉登录;改密码会换密钥,旧会话全部失效。
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { DATA_HOME } from "../system/paths.js";
import { appDomain } from "./domain.js";

const AUTH_FILE = path.join(DATA_HOME, "auth.json");
const INITIAL_FILE = path.join(DATA_HOME, "initial-password.txt");
const COOKIE = "aios_session";
const SESSION_DAYS = 30;

type AuthState = { salt: string; hash: string; secret: string };

const hashPassword = (password: string, salt: string) => scryptSync(password, salt, 32).toString("hex");

const writeState = (password: string): AuthState => {
  const state = { salt: randomBytes(16).toString("hex"), hash: "", secret: randomBytes(32).toString("hex") };
  state.hash = hashPassword(password, state.salt);
  fs.mkdirSync(DATA_HOME, { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(state), { mode: 0o600 });
  return state;
};

let state: AuthState | null = null;

/** 启动时调用一次:确定当前密码。 */
export const initAuth = () => {
  const fromEnv = String(process.env.AIOS_PASSWORD || "");
  let existing: AuthState | null = null;
  try { existing = JSON.parse(fs.readFileSync(AUTH_FILE, "utf8")); } catch { /* 首次启动 */ }

  if (fromEnv) {
    state = existing && hashPassword(fromEnv, existing.salt) === existing.hash ? existing : writeState(fromEnv);
    return;
  }
  if (existing?.hash) { state = existing; return; }

  const generated = randomBytes(9).toString("base64url");
  state = writeState(generated);
  fs.writeFileSync(INITIAL_FILE, generated + "\n", { mode: 0o600 });
  console.log(`\n🔑  初始登录密码: ${generated}\n    (也保存在 ${INITIAL_FILE},登录后请在「设置」里修改)\n`);
};

const sign = (value: string) => createHmac("sha256", state!.secret).update(value).digest("base64url");

const issueToken = () => {
  const expires = Date.now() + SESSION_DAYS * 86400_000;
  const payload = `${expires}.${randomBytes(8).toString("hex")}`;
  return `${payload}.${sign(payload)}`;
};

const validToken = (token: string) => {
  const at = token.lastIndexOf(".");
  if (at <= 0 || !state) return false;
  const payload = token.slice(0, at);
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(token.slice(at + 1));
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  return Number(payload.split(".")[0]) > Date.now();
};

const readCookie = (req: IncomingMessage) => {
  for (const part of String(req.headers.cookie || "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === COOKIE) return rest.join("=");
  }
  return "";
};

// 内部令牌:宿主自己 spawn 的命令(agent 的 bash)经环境变量 AIOS_API_TOKEN 拿到,
// 用 Authorization: Bearer 调本机 API(比如应用取址)。每次启动重新生成,不落盘。
const INTERNAL_TOKEN = randomBytes(24).toString("hex");
process.env.AIOS_API_TOKEN = INTERNAL_TOKEN;

const bearerOk = (req: IncomingMessage) => {
  const given = Buffer.from(String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim());
  const expected = Buffer.from(INTERNAL_TOKEN);
  return given.length === expected.length && timingSafeEqual(given, expected);
};

export const isAuthenticated = (req: IncomingMessage) => validToken(readCookie(req)) || bearerOk(req);

const verifyPassword = (password: string) => {
  if (!state) return false;
  const expected = Buffer.from(state.hash, "hex");
  const given = Buffer.from(hashPassword(password, state.salt), "hex");
  return expected.length === given.length && timingSafeEqual(expected, given);
};

const isHttps = (req: IncomingMessage) =>
  String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() === "https" || (req.socket as any).encrypted;

const setCookie = (req: IncomingMessage, res: ServerResponse, token: string, maxAge: number) => {
  const parts = [`${COOKIE}=${token}`, "Path=/", "HttpOnly", "SameSite=Strict", `Max-Age=${maxAge}`];
  if (isHttps(req)) parts.push("Secure");
  // 配了应用子域名时,cookie 要覆盖 <id>.<域名>,应用页面才认得这次登录
  const domain = appDomain();
  const host = String(req.headers.host || "").toLowerCase().replace(/:\d+$/, "");
  if (domain && (host === domain || host.endsWith(`.${domain}`))) parts.push(`Domain=${domain}`);
  res.setHeader("Set-Cookie", parts.join("; "));
};

const readBody = async (req: IncomingMessage): Promise<any> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch { return {}; }
};

const reply = (res: ServerResponse, code: number, data: unknown) => {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
};

// 简单的登录失败节流:同一 IP 连续失败越多,等得越久
const failures = new Map<string, { count: number; until: number }>();
const clientIp = (req: IncomingMessage) =>
  String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "";

/** /api/auth/*。返回 true = 已处理。 */
export const handleAuthRoutes = async (req: IncomingMessage, res: ServerResponse, pathname: string, method: string) => {
  if (!pathname.startsWith("/api/auth/")) return false;

  if (pathname === "/api/auth/state" && method === "GET") {
    reply(res, 200, { authenticated: isAuthenticated(req) });
    return true;
  }

  if (pathname === "/api/auth/login" && method === "POST") {
    const ip = clientIp(req);
    const record = failures.get(ip);
    if (record && record.until > Date.now()) {
      reply(res, 429, { error: "尝试太频繁,请稍后再试" });
      return true;
    }
    const { password } = await readBody(req);
    if (!verifyPassword(String(password || ""))) {
      const count = (record?.count || 0) + 1;
      failures.set(ip, { count, until: count >= 5 ? Date.now() + Math.min(2 ** (count - 5), 60) * 60_000 : 0 });
      reply(res, 401, { error: "密码不对" });
      return true;
    }
    failures.delete(ip);
    setCookie(req, res, issueToken(), SESSION_DAYS * 86400);
    reply(res, 200, { ok: true });
    return true;
  }

  if (pathname === "/api/auth/logout" && method === "POST") {
    setCookie(req, res, "", 0);
    reply(res, 200, { ok: true });
    return true;
  }

  if (pathname === "/api/auth/password" && method === "POST") {
    if (!isAuthenticated(req)) { reply(res, 401, { error: "未登录" }); return true; }
    const { current, next } = await readBody(req);
    if (!verifyPassword(String(current || ""))) { reply(res, 400, { error: "当前密码不对" }); return true; }
    if (String(next || "").length < 8) { reply(res, 400, { error: "新密码至少 8 位" }); return true; }
    state = writeState(String(next));
    fs.rmSync(INITIAL_FILE, { force: true });
    setCookie(req, res, issueToken(), SESSION_DAYS * 86400);
    reply(res, 200, { ok: true });
    return true;
  }

  return false;
};

/**
 * 跨站写保护:带副作用的请求(非 GET/HEAD)与 ws 升级,Origin 必须与 Host 同源。
 * 无 Origin 头(curl、同源导航)放行 —— 它们仍然要过登录这道闸。
 */
export const isSameOrigin = (req: IncomingMessage) => {
  const origin = String(req.headers.origin || "").trim();
  if (!origin) return true;
  try {
    return new URL(origin).host.toLowerCase() === String(req.headers.host || "").toLowerCase();
  } catch {
    return false;
  }
};
