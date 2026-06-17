// 扩展连接配置 · 三字段(BASE_URL / WS_URL / TOKEN)· 存 chrome.storage.local
//   · config.js 里的值作为默认(本地 AGENT 开箱即用),popup 里填的会覆盖

import { BASE_URL, WS_URL, TOKEN } from '../config.js';

const KEYS = ['meem_base', 'meem_ws', 'meem_token'];

export async function getConfig() {
  const v = await chrome.storage.local.get(KEYS);
  return {
    base: (v?.meem_base || BASE_URL || '').trim(),
    ws: (v?.meem_ws || WS_URL || '').trim(),
    token: (v?.meem_token || TOKEN || '').trim(),
  };
}

export async function setConfig({ base, ws, token }) {
  await chrome.storage.local.set({
    meem_base: (base || '').trim(),
    meem_ws: (ws || '').trim(),
    meem_token: (token || '').trim(),
  });
}

export async function clearConfig() {
  await chrome.storage.local.remove(KEYS);
}
