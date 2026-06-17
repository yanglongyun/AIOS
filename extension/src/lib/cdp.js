// 维护一份「已 attach 的 tabId 集」· 让 browser_evaluate 不用每次重新 attach

const DEBUGGER_VERSION = '1.3';
const attachedTabs = new Set();

export async function sendDebuggerCommand(tabId, method, params = {}) {
  if (!attachedTabs.has(tabId)) {
    await chrome.debugger.attach({ tabId }, DEBUGGER_VERSION);
    attachedTabs.add(tabId);
  }
  return chrome.debugger.sendCommand({ tabId }, method, params);
}

chrome.debugger?.onDetach?.addListener((source) => {
  if (typeof source.tabId === 'number') attachedTabs.delete(source.tabId);
});
