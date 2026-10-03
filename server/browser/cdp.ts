// 浏览器连接:AIOS 自己管的一个 Chrome,走 CDP(Chrome DevTools Protocol)。
//
// 一条 WebSocket 连到浏览器级端点,页面和跨源 iframe 都用 flatten 模式的 sessionId 区分。
// Chrome 用独立的 user-data-dir(~/.aios/browser),登录态在 AIOS 重启之间保留;
// 进程 detached 启动,AIOS 重启后直接重连同一个浏览器,不会丢开着的标签。
//
// 有图形桌面(DISPLAY)时开有头浏览器 —— 用户在远程桌面里看得见 AI 在操作;没有就无头。
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import WebSocket from "ws";
import { DATA_HOME } from "../system/paths.js";

const PORT = Number(process.env.AIOS_BROWSER_PORT) || 9222;
const ENDPOINT = `http://127.0.0.1:${PORT}`;

type Pending = { resolve: (v: any) => void; reject: (e: Error) => void; timer: NodeJS.Timeout };
type Listener = (params: any, sessionId?: string) => void;

/** 每个页面(标签)的状态:主 session、iframe 子 session、隔离世界、快照。 */
export type PageState = {
  targetId: string;
  sessionId: string;
  children: Map<string, { url: string; type: string }>;
  isolated: Map<string, number>;
  snapshot: { version: number; refs: Map<string, { backendNodeId: number; sessionId: string }> } | null;
  snapshotSeq: number;
  loadWaiters: Array<() => void>;
};

let ws: WebSocket | null = null;
let connecting: Promise<void> | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();
const listeners = new Map<string, Set<Listener>>();
const pages = new Map<string, PageState>();          // targetId → 状态
const sessionOwner = new Map<string, string>();      // 任意 sessionId → 所属页面 targetId

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const CANDIDATES = () => {
  const list = [
    process.env.AIOS_CHROME,
    "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/opt/google/chrome/chrome", "/snap/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  // Playwright 下载过的 Chromium 也能用
  for (const root of [process.env.PLAYWRIGHT_BROWSERS_PATH, path.join(os.homedir(), ".cache/ms-playwright")]) {
    if (!root || !existsSync(root)) continue;
    for (const dir of readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()) {
      list.push(path.join(root, dir, "chrome-linux", "chrome"), path.join(root, dir, "chrome-linux64", "chrome"));
    }
  }
  return list.filter(Boolean) as string[];
};

export const findChrome = () => CANDIDATES().find((p) => existsSync(p)) || "";

const alive = async () => {
  try {
    const r = await fetch(`${ENDPOINT}/json/version`, { signal: AbortSignal.timeout(1500) });
    return r.ok ? (await r.json()) as { webSocketDebuggerUrl: string } : null;
  } catch { return null; }
};

const launch = async () => {
  const bin = findChrome();
  if (!bin) {
    throw new Error("这台机器上没有 Chrome/Chromium。装一个(如 apt install chromium 或 Google Chrome),"
      + "或用环境变量 AIOS_CHROME 指定可执行文件路径。");
  }
  const profile = path.join(DATA_HOME, "browser");
  mkdirSync(profile, { recursive: true });
  const display = process.env.AIOS_DISPLAY || process.env.DISPLAY || "";
  const args = [
    `--remote-debugging-port=${PORT}`, "--remote-debugging-address=127.0.0.1",
    `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check",
    "--disable-dev-shm-usage", "--window-size=1280,800", "--lang=zh-CN",
    "--hide-crash-restore-bubble", "--disable-session-crashed-bubble",
  ];
  if (!display) args.push("--headless=new");
  if (process.getuid?.() === 0) args.push("--no-sandbox"); // root 下 Chrome 不肯开沙箱
  args.push("about:blank");
  const child = spawn(bin, args, {
    detached: true, stdio: "ignore",
    env: { ...process.env, ...(display ? { DISPLAY: display } : {}) },
  });
  child.unref();
  for (let i = 0; i < 40; i++) {
    const info = await alive();
    if (info) return info;
    await sleep(250);
  }
  throw new Error(`Chrome 启动了但调试端口 ${PORT} 没有响应(${bin})`);
};

const dispatch = (method: string, params: any, sessionId?: string) => {
  // 页面层面的账:iframe 进出、页面导航、标签关掉
  if (method === "Target.attachedToTarget" && sessionId) {
    const owner = sessionOwner.get(sessionId);
    const state = owner ? pages.get(owner) : undefined;
    if (state) {
      state.children.set(params.sessionId, { url: params.targetInfo?.url || "", type: params.targetInfo?.type || "" });
      sessionOwner.set(params.sessionId, state.targetId);
      void send("Runtime.runIfWaitingForDebugger", {}, params.sessionId).catch(() => {});
    }
  } else if (method === "Target.detachedFromTarget") {
    const owner = sessionOwner.get(params.sessionId);
    const state = owner ? pages.get(owner) : undefined;
    if (state && state.sessionId === params.sessionId) pages.delete(state.targetId);
    else state?.children.delete(params.sessionId);
    sessionOwner.delete(params.sessionId);
  } else if (method === "Target.targetDestroyed") {
    pages.delete(params.targetId);
  } else if ((method === "Page.frameNavigated" && !params.frame?.parentId) || method === "Page.loadEventFired") {
    const owner = sessionId ? sessionOwner.get(sessionId) : undefined;
    const state = owner ? pages.get(owner) : undefined;
    if (state && state.sessionId === sessionId) {
      state.isolated.clear();
      state.snapshot = null; // 页面换了,旧 ref 全部作废
      if (method === "Page.loadEventFired") state.loadWaiters.splice(0).forEach((fn) => fn());
    }
  }
  listeners.get(method)?.forEach((fn) => fn(params, sessionId));
};

const connect = async () => {
  if (ws && ws.readyState === WebSocket.OPEN) return;
  if (connecting) return connecting;
  connecting = (async () => {
    const info = (await alive()) || (await launch());
    const socket = new WebSocket(info.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 256 * 1024 * 1024 });
    await new Promise<void>((resolve, reject) => { socket.once("open", () => resolve()); socket.once("error", reject); });
    socket.on("message", (raw) => {
      const msg = JSON.parse(String(raw));
      if (msg.id) {
        const p = pending.get(msg.id);
        if (!p) return;
        pending.delete(msg.id);
        clearTimeout(p.timer);
        if (msg.error) p.reject(new Error(msg.error.message || "CDP 错误"));
        else p.resolve(msg.result);
      } else if (msg.method) dispatch(msg.method, msg.params, msg.sessionId);
    });
    socket.on("close", () => {
      if (ws === socket) ws = null;
      pages.clear();
      sessionOwner.clear();
      for (const [id, p] of pending) { clearTimeout(p.timer); p.reject(new Error("浏览器连接断开了")); pending.delete(id); }
    });
    ws = socket;
    await send("Target.setDiscoverTargets", { discover: true });
  })().finally(() => { connecting = null; });
  return connecting;
};

/** 发一条 CDP 命令。sessionId 指定页面或 iframe;不给就是浏览器级。 */
export const send = async (method: string, params: Record<string, unknown> = {}, sessionId?: string, timeoutMs = 30_000): Promise<any> => {
  await connect();
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`浏览器没有响应(${method} 超时)`)); }, timeoutMs);
    pending.set(id, { resolve, reject, timer });
    ws!.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
};

export type TabInfo = { id: string; title: string; url: string };

/** 开着的网页标签(不含 DevTools、扩展页)。 */
export const listTabs = async (): Promise<TabInfo[]> => {
  const { targetInfos } = await send("Target.getTargets");
  return (targetInfos || [])
    .filter((t: any) => t.type === "page" && !/^(devtools|chrome-extension):/.test(t.url))
    .map((t: any) => ({ id: t.targetId, title: t.title, url: t.url }));
};

/** 附加到一个页面(懒,附过就复用)。 */
export const pageOf = async (targetId: string): Promise<PageState> => {
  await connect();
  const known = pages.get(targetId);
  if (known) return known;
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const state: PageState = {
    targetId, sessionId, children: new Map(), isolated: new Map(), snapshot: null, snapshotSeq: 0, loadWaiters: [],
  };
  pages.set(targetId, state);
  sessionOwner.set(sessionId, targetId);
  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId).catch(() => {});
  // 跨源 iframe 自动附加进来,共用这条连接
  await send("Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }, sessionId).catch(() => {});
  return state;
};

export const openTab = async (url: string) => {
  const { targetId } = await send("Target.createTarget", { url });
  const state = await pageOf(targetId);
  await waitLoad(state, 15_000);
  return targetId;
};

/** 等页面 load 事件;等不到就按 readyState 兜底,超时不算错(SPA 常常没有完整的 load)。 */
export const waitLoad = async (state: PageState, timeoutMs = 20_000) => {
  const loaded = new Promise<void>((resolve) => state.loadWaiters.push(resolve));
  const deadline = Date.now() + timeoutMs;
  const poll = (async () => {
    while (Date.now() < deadline) {
      await sleep(300);
      const r = await send("Runtime.evaluate", { expression: "document.readyState", returnByValue: true }, state.sessionId).catch(() => null);
      if (r?.result?.value === "complete") return;
    }
  })();
  await Promise.race([loaded, poll, sleep(timeoutMs)]);
};

/** 当前页面 + 子 iframe 的 session 清单。 */
export const sessionsOf = (state: PageState) => [
  { sessionId: state.sessionId, url: "", type: "page" },
  ...[...state.children.entries()].filter(([, c]) => c.type === "iframe").map(([sessionId, c]) => ({ sessionId, ...c })),
];

/**
 * 在**隔离世界**里执行表达式:页面的脚本看不见也改不了我们的代码(hook 不到 querySelector 之类)。
 * DOM 是共享的,读写页面都没问题。
 */
export const evaluate = async (state: PageState, expression: string, sessionId = state.sessionId) => {
  if (!state.isolated.has(sessionId)) {
    const tree = await send("Page.getFrameTree", {}, sessionId);
    const created = await send("Page.createIsolatedWorld", {
      frameId: tree.frameTree.frame.id, worldName: "aios", grantUniveralAccess: true,
    }, sessionId);
    state.isolated.set(sessionId, created.executionContextId);
  }
  const result = await send("Runtime.evaluate", {
    expression, contextId: state.isolated.get(sessionId), returnByValue: true, awaitPromise: true, userGesture: true,
  }, sessionId);
  if (result.exceptionDetails) {
    const text = result.exceptionDetails.exception?.description || result.exceptionDetails.text || "页面里的 JS 抛错了";
    throw new Error(String(text).slice(0, 2000));
  }
  return result.result?.value;
};

export const pageUrl = async (state: PageState) =>
  String((await send("Runtime.evaluate", { expression: "location.href", returnByValue: true }, state.sessionId).catch(() => null))?.result?.value || "");

export const browserEndpoint = ENDPOINT;
