// 给 tool 实现共用 · 都是 chrome.tabs 上面的薄包装

export async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) throw new Error('no_active_tab');
  return tab;
}

export function tabSlim(t) {
  return {
    id: t.id, url: t.url, title: t.title, active: t.active,
    pinned: t.pinned, status: t.status, windowId: t.windowId, index: t.index,
  };
}

export function pickTab(tabs, tabId) {
  if (tabId !== undefined) {
    const t = tabs.find((x) => x.id === tabId);
    if (!t) throw new Error(`tab_not_found: ${tabId}`);
    return t;
  }
  const active = tabs.find((x) => x.active && x.windowId);
  if (!active) throw new Error('no_active_tab');
  return active;
}
