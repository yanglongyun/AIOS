// tab 管理 · status / open / list / activate / close / navigate

import { getActiveTab, tabSlim } from '../lib/active-tab.js';

export async function status() {
  const all = await chrome.tabs.query({});
  const active = await getActiveTab().catch(() => null);
  return {
    ready: true,
    tabsTotal: all.length,
    active: active ? tabSlim(active) : null,
    extensionId: chrome.runtime.id,
    version: chrome.runtime.getManifest().version,
  };
}

export async function openTab(args) {
  const url = String(args?.url || '').trim();
  if (!url) throw new Error('url_required');
  const tab = await chrome.tabs.create({
    url, active: false,
    ...(typeof args?.windowId === 'number' ? { windowId: args.windowId } : {}),
  });
  return tabSlim(tab);
}

export async function list(args) {
  const q = {};
  if (typeof args?.currentWindow === 'boolean') q.currentWindow = args.currentWindow;
  if (typeof args?.active === 'boolean') q.active = args.active;
  if (typeof args?.windowId === 'number') q.windowId = args.windowId;
  const tabs = await chrome.tabs.query(q);
  return tabs.map(tabSlim);
}

export async function activate(args) {
  const tabId = Number(args?.tabId);
  if (!Number.isFinite(tabId)) throw new Error('tabId_required');
  const tab = await chrome.tabs.update(tabId, { active: true });
  if (tab?.windowId) {
    try { await chrome.windows.update(tab.windowId, { focused: true }); } catch {}
  }
  return tab ? tabSlim(tab) : { ok: true, tabId };
}

export async function close(args) {
  const tabId = Number(args?.tabId);
  if (!Number.isFinite(tabId)) throw new Error('tabId_required');
  await chrome.tabs.remove(tabId);
  return { ok: true, tabId };
}

export async function navigate(args) {
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
}
