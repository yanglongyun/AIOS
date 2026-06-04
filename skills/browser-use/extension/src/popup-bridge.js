import { WS_URL } from '../config.js';
import { bridgeState, lastConnectedAt, lastDisconnectedAt, lastError, reconnect } from './ws.js';

async function popupStatus() {
  return {
    bridge: bridgeState(),
    ready: bridgeState() === 'connected',
    serviceUrl: WS_URL,
    extensionId: chrome.runtime.id,
    version: chrome.runtime.getManifest().version,
    lastConnectedAt,
    lastDisconnectedAt,
    lastError,
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== 'object') return false;

  if (message.type === 'agent.browser.status') {
    popupStatus().then((data) => sendResponse({ ok: true, data }));
    return true;
  }
  if (message.type === 'agent.browser.reconnect') {
    reconnect();
    popupStatus().then((data) => sendResponse({ ok: true, data }));
    return true;
  }
  return false;
});
