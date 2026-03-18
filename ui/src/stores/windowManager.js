import { reactive, shallowRef } from 'vue';
import { appRegistry } from '../desktop/apps.js';
import { useI18n } from '../i18n/index.js';

const state = reactive({
  windows: [],
  nextZ: 10
});

function findApp(appId) {
  return appRegistry.find(a => a.id === appId);
}

async function open(appId, props = {}) {
  // 已存在则聚焦并更新 props
  const existing = state.windows.find(w => w.appId === appId);
  if (existing) {
    Object.assign(existing.props, props);
    if (existing.state === 'minimized') existing.state = 'normal';
    focus(existing.id);
    return existing;
  }

  const app = findApp(appId);
  if (!app) return null;

  const { t } = useI18n();
  const mod = await app.load();
  const component = shallowRef(mod.default);

  const cascade = (state.windows.length % 8) * 30;
  const dw = app.defaultSize?.w || 800;
  const dh = app.defaultSize?.h || 560;

  const win = reactive({
    id: appId + '-' + Date.now(),
    appId,
    title: t(app.name),
    component,
    props: { ...props },
    x: 120 + cascade,
    y: 60 + cascade,
    w: Math.min(dw, window.innerWidth - 80),
    h: Math.min(dh, window.innerHeight - 80),
    minW: app.minSize?.w || 360,
    minH: app.minSize?.h || 280,
    zIndex: ++state.nextZ,
    state: 'normal',
    prevRect: null
  });

  state.windows.push(win);
  return win;
}

function close(windowId) {
  const idx = state.windows.findIndex(w => w.id === windowId);
  if (idx !== -1) state.windows.splice(idx, 1);
}

function closeAll() {
  state.windows.splice(0);
}

function minimize(windowId) {
  const win = state.windows.find(w => w.id === windowId);
  if (win) win.state = 'minimized';
}

function maximize(windowId) {
  const win = state.windows.find(w => w.id === windowId);
  if (!win) return;
  if (win.state === 'maximized') {
    // 还原
    if (win.prevRect) {
      Object.assign(win, win.prevRect);
      win.prevRect = null;
    }
    win.state = 'normal';
  } else {
    win.prevRect = { x: win.x, y: win.y, w: win.w, h: win.h };
    win.x = 0;
    win.y = 0;
    win.w = window.innerWidth;
    win.h = window.innerHeight;
    win.state = 'maximized';
  }
}

function focus(windowId) {
  const win = state.windows.find(w => w.id === windowId);
  if (win) win.zIndex = ++state.nextZ;
}

function updatePosition(windowId, x, y) {
  const win = state.windows.find(w => w.id === windowId);
  if (win) { win.x = x; win.y = y; }
}

function updateSize(windowId, w, h) {
  const win = state.windows.find(w => w.id === windowId);
  if (win) {
    win.w = Math.max(w, win.minW);
    win.h = Math.max(h, win.minH);
  }
}

export const windowManager = {
  state,
  open,
  close,
  closeAll,
  minimize,
  maximize,
  focus,
  updatePosition,
  updateSize
};
