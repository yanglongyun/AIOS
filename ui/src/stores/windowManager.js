import { reactive, shallowRef } from "vue";
import { appRegistry } from "../apps.js";
const TASKBAR_H = 44;
const WINDOW_Z_BASE = 10;
const protocolCache = new Map();
const state = reactive({
  windows: [],
  nextZ: WINDOW_Z_BASE
});
function rebalanceZ(activeWindowId = null) {
  const ordered = [...state.windows].sort((a, b) => a.zIndex - b.zIndex);
  const active = activeWindowId ? ordered.find((win) => win.id === activeWindowId) : null;
  const rest = active ? ordered.filter((win) => win.id !== activeWindowId) : ordered;
  rest.forEach((win, index) => {
    win.zIndex = WINDOW_Z_BASE + index;
  });
  if (active) {
    active.zIndex = WINDOW_Z_BASE + rest.length;
  }
  state.nextZ = WINDOW_Z_BASE + Math.max(0, state.windows.length - 1);
}
function findApp(appId) {
  return appRegistry.find((a) => a.id === appId);
}
async function loadProtocol(app) {
  if (!app?.protocol) return null;
  if (protocolCache.has(app.id)) return protocolCache.get(app.id);
  const mod = await app.protocol();
  const handler = mod?.protocol || mod?.default || null;
  protocolCache.set(app.id, handler);
  return handler;
}
async function open(appId, props = {}) {
  const existing = state.windows.find((w) => w.appId === appId);
  if (existing) {
    Object.assign(existing.props, props);
    if (existing.state === "minimized") existing.state = "normal";
    focus(existing.id);
    return existing;
  }
  const app = findApp(appId);
  if (!app) return null;
  const mod = await app.load();
  const component = shallowRef(mod.default);
  const cascade = state.windows.length % 8 * 30;
  const dw = app.defaultSize?.w || 800;
  const dh = app.defaultSize?.h || 560;
  const win = reactive({
    id: appId + "-" + Date.now(),
    appId,
    title: app.name,
    component,
    props: { ...props },
    x: 120 + cascade,
    y: 60 + cascade,
    w: Math.min(dw, window.innerWidth - 80),
    h: Math.min(dh, window.innerHeight - 80),
    minW: app.minSize?.w || 360,
    minH: app.minSize?.h || 280,
    zIndex: WINDOW_Z_BASE,
    state: "normal",
    prevRect: null
  });
  state.windows.push(win);
  rebalanceZ(win.id);
  return win;
}
async function openByProtocol(payload = {}) {
  const appId = String(payload.app || "").trim();
  if (!appId) throw new Error("Protocol payload is missing app");
  const app = findApp(appId);
  if (!app) throw new Error(`Unknown app: ${appId}`);
  const handler = await loadProtocol(app);
  if (!handler?.open) {
    return open(appId, payload.props || {});
  }
  return handler.open({
    payload,
    existingWindow: state.windows.find((win) => win.appId === appId) || null,
    openWindow: (props = {}) => open(appId, props),
    focusWindow: (windowId) => focus(windowId),
    closeWindow: (windowId) => close(windowId)
  });
}
function close(windowId) {
  const idx = state.windows.findIndex((w) => w.id === windowId);
  if (idx !== -1) {
    state.windows.splice(idx, 1);
    rebalanceZ();
  }
}
function closeAll() {
  state.windows.splice(0);
  state.nextZ = WINDOW_Z_BASE;
}
function minimize(windowId) {
  const win = state.windows.find((w) => w.id === windowId);
  if (win) win.state = "minimized";
}
function maximize(windowId) {
  const win = state.windows.find((w) => w.id === windowId);
  if (!win) return;
  if (win.state === "maximized") {
    if (win.prevRect) {
      Object.assign(win, win.prevRect);
      win.prevRect = null;
    }
    win.state = "normal";
  } else {
    win.prevRect = { x: win.x, y: win.y, w: win.w, h: win.h };
    win.x = 0;
    win.y = 0;
    win.w = window.innerWidth;
    win.h = window.innerHeight - TASKBAR_H;
    win.state = "maximized";
  }
}
function focus(windowId) {
  if (state.windows.some((w) => w.id === windowId)) {
    rebalanceZ(windowId);
  }
}
function updatePosition(windowId, x, y) {
  const win = state.windows.find((w) => w.id === windowId);
  if (win) {
    win.x = x;
    win.y = y;
  }
}
function updateSize(windowId, w, h) {
  const win = state.windows.find((w2) => w2.id === windowId);
  if (win) {
    win.w = Math.max(w, win.minW);
    win.h = Math.max(h, win.minH);
  }
}
const windowManager = {
  state,
  open,
  openByProtocol,
  close,
  closeAll,
  minimize,
  maximize,
  focus,
  updatePosition,
  updateSize
};
export {
  windowManager
};
