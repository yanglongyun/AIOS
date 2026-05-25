const SERVICE_WS_URL = 'ws://127.0.0.1:8765/extension';
const DEBUGGER_VERSION = '1.3';
const attachedTabs = new Set();

let ws = null;
let reconnectTimer = null;
let heartbeatTimer = null;
let reconnectDelay = 500;

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectDelay = Math.min(reconnectDelay * 1.6, 8000);
    connect();
  }, reconnectDelay);
}

function connect() {
  try {
    ws = new WebSocket(SERVICE_WS_URL);
  } catch {
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    reconnectDelay = 500;
    send({ type: 'extension.ready', extensionId: chrome.runtime.id, version: chrome.runtime.getManifest().version });
    startHeartbeat();
  };
  ws.onmessage = (event) => handleFrame(event.data);
  ws.onclose = scheduleReconnect;
  ws.onerror = () => {
    try { ws.close(); } catch {}
  };
}

function startHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    send({ type: 'extension.ping', time: Date.now() });
  }, 20_000);
}

function send(frame) {
  if (ws?.readyState !== WebSocket.OPEN) return false;
  ws.send(JSON.stringify(frame));
  return true;
}

async function handleFrame(raw) {
  let frame;
  try {
    frame = JSON.parse(String(raw));
  } catch {
    return;
  }
  if (frame?.type !== 'tool.call' || !frame.id) return;
  try {
    const data = await runTool(frame.tool, frame.args || {});
    send({ id: frame.id, type: 'tool.result', ok: true, data });
  } catch (error) {
    send({ id: frame.id, type: 'tool.result', ok: false, error: error?.message || String(error) });
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) throw new Error('no_active_tab');
  return tab;
}

function tabSlim(tab) {
  return {
    id: tab.id,
    url: tab.url,
    title: tab.title,
    active: tab.active,
    pinned: tab.pinned,
    status: tab.status,
    windowId: tab.windowId,
    index: tab.index,
  };
}

function pickTab(tabs, tabId) {
  if (tabId !== undefined) {
    const tab = tabs.find((item) => item.id === tabId);
    if (!tab) throw new Error(`tab_not_found: ${tabId}`);
    return tab;
  }
  const active = tabs.find((item) => item.active && item.windowId);
  if (!active) throw new Error('no_active_tab');
  return active;
}

function debuggerTarget(tabId) {
  return { tabId };
}

async function ensureDebuggerAttached(tabId) {
  if (attachedTabs.has(tabId)) return;
  await chrome.debugger.attach(debuggerTarget(tabId), DEBUGGER_VERSION);
  attachedTabs.add(tabId);
}

async function sendDebuggerCommand(tabId, method, commandParams = {}) {
  await ensureDebuggerAttached(tabId);
  return chrome.debugger.sendCommand(debuggerTarget(tabId), method, commandParams);
}

chrome.debugger?.onDetach?.addListener((source) => {
  if (typeof source.tabId === 'number') attachedTabs.delete(source.tabId);
});

const handlers = {
  async browser_status() {
    const all = await chrome.tabs.query({});
    const active = await getActiveTab().catch(() => null);
    return {
      bridge: 'chrome-extension',
      ready: true,
      tabsTotal: all.length,
      active: active ? tabSlim(active) : null,
      extensionId: chrome.runtime.id,
      version: chrome.runtime.getManifest().version,
    };
  },

  async browser_open_tab(args) {
    const url = String(args?.url || '').trim();
    if (!url) throw new Error('url_required');
    const tab = await chrome.tabs.create({
      url,
      active: false,
      ...(typeof args?.windowId === 'number' ? { windowId: args.windowId } : {}),
    });
    return tabSlim(tab);
  },

  async browser_tabs(args) {
    const query = {};
    if (typeof args?.currentWindow === 'boolean') query.currentWindow = args.currentWindow;
    if (typeof args?.active === 'boolean') query.active = args.active;
    if (typeof args?.windowId === 'number') query.windowId = args.windowId;
    const tabs = await chrome.tabs.query(query);
    return tabs.map(tabSlim);
  },

  async browser_activate_tab(args) {
    const tabId = Number(args?.tabId);
    if (!Number.isFinite(tabId)) throw new Error('tabId_required');
    const tab = await chrome.tabs.update(tabId, { active: true });
    if (tab?.windowId) {
      try { await chrome.windows.update(tab.windowId, { focused: true }); } catch {}
    }
    return tab ? tabSlim(tab) : { ok: true, tabId };
  },

  async browser_close_tab(args) {
    const tabId = Number(args?.tabId);
    if (!Number.isFinite(tabId)) throw new Error('tabId_required');
    await chrome.tabs.remove(tabId);
    return { ok: true, tabId };
  },

  async browser_navigate(args) {
    const url = String(args?.url || '').trim();
    if (!url) throw new Error('url_required');
    let tabId = Number(args?.tabId);
    if (!Number.isFinite(tabId)) {
      const tab = await getActiveTab();
      if (!tab.id) throw new Error('no_active_tab');
      tabId = tab.id;
    }
    const tab = await chrome.tabs.update(tabId, { url });
    return tab ? tabSlim(tab) : { ok: true, tabId };
  },

  async browser_evaluate(args) {
    const code = String(args?.script || args?.code || '').trim();
    if (!code) throw new Error('code_required');
    let tabId = Number(args?.tabId);
    if (!Number.isFinite(tabId)) {
      const tab = await getActiveTab();
      if (!tab.id) throw new Error('no_active_tab');
      tabId = tab.id;
    }
    const expression = `(async () => { ${code} })()`;
    const evaluation = await sendDebuggerCommand(tabId, 'Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: args?.returnByValue !== false,
    });
    return { tabId, evaluation };
  },

  async browser_screenshot(args) {
    let tabId;
    let windowId;
    if (typeof args?.tabId === 'number') {
      tabId = args.tabId;
      const all = await chrome.tabs.query({});
      windowId = pickTab(all, tabId).windowId;
    } else {
      const tab = await getActiveTab();
      tabId = tab.id;
      windowId = tab.windowId;
    }
    const format = args?.format === 'jpeg' ? 'jpeg' : 'png';
    const quality = typeof args?.quality === 'number' ? args.quality : undefined;
    const dataUrl = await chrome.tabs.captureVisibleTab(
      windowId,
      { format, ...(quality !== undefined ? { quality } : {}) },
    );
    return { tabId, format, bytes: dataUrl.length, dataUrl };
  },
};

async function runTool(name, args) {
  const handler = handlers[name];
  if (!handler) throw new Error(`unknown_tool: ${name}`);
  return handler(args || {});
}

chrome.runtime.onInstalled.addListener(connect);
chrome.runtime.onStartup.addListener(connect);
connect();
