// popup ↔ background 通信 · 配置(三字段)/ 状态 / 断开
//   · 与电脑端一致:接口地址 / WebSocket / 令牌 Token
//   · 保存配置 → setConfig → reconnect()

import { getConfig, setConfig, clearConfig } from './store.js';
import { bridgeState, reconnect, lastConnectedAt, lastDisconnectedAt, lastError } from './ws.js';

async function popupStatus() {
  const cfg = await getConfig();
  return {
    configured: !!cfg.token && !!cfg.ws,
    hasToken: !!cfg.token,
    base: cfg.base,
    ws: cfg.ws,
    bridge: bridgeState(),
    ready: bridgeState() === 'connected',
    extensionId: chrome.runtime.id,
    version: chrome.runtime.getManifest().version,
    lastConnectedAt,
    lastDisconnectedAt,
    lastError,
  };
}

async function handleConnect({ base, ws, token }) {
  const t = (token || '').trim();
  const w = (ws || '').trim();
  if (!t) throw new Error('请填写令牌 Token');
  if (!w) throw new Error('请填写 WebSocket 地址');
  await setConfig({ base, ws: w, token: t });
  reconnect();
  return { ok: true };
}

async function handleDisconnect() {
  await clearConfig();
  reconnect(); // 无配置会自然不连
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== 'object') return false;

  if (message.type === 'meem.popup-status') {
    popupStatus().then((data) => sendResponse({ ok: true, data }));
    return true;
  }
  if (message.type === 'meem.connect') {
    handleConnect(message.config || {})
      .then((r) => sendResponse({ ok: true, data: r }))
      .catch((e) => sendResponse({ ok: false, error: e?.message || String(e) }));
    return true;
  }
  if (message.type === 'meem.logout' || message.type === 'meem.disconnect') {
    handleDisconnect().then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});
