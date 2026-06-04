// 截当前可见 tab · 通过 chrome.tabs.captureVisibleTab · 返 dataUrl

import { getActiveTab, pickTab } from '../lib/active-tab.js';

export async function screenshot(args) {
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
    windowId, { format, ...(quality !== undefined ? { quality } : {}) },
  );
  return { tabId, format, bytes: dataUrl.length, dataUrl };
}
