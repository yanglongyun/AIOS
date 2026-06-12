// System shell state — tracks the foreground app for the global topbar.
// Everything is an app: the shell just tracks which app fills the screen.
import { ref, shallowRef } from 'vue';
import { getApp } from '../apps.js';

const DEFAULT_APP = 'chat';

export const currentAppId = ref(null);
export const currentApp = shallowRef(null);

// Apps may override the topbar title (e.g. chat shows the conversation name)
// and register one left action (e.g. chat's hamburger toggles its history).
// Both reset on every app switch.
export const topTitle = ref('');
export const topLeftAction = shallowRef(null); // { icon: 'menu', fn }

export async function openApp(appId, props = {}) {
  const app = getApp(appId) || getApp(DEFAULT_APP);
  if (!app || app.id === currentAppId.value) return;
  const mod = await app.load();
  topTitle.value = app.name;
  topLeftAction.value = null;
  currentApp.value = { id: app.id, component: mod.default || mod, props };
  currentAppId.value = app.id;
  const hash = `#/app/${app.id}`;
  if (location.hash !== hash) history.replaceState(null, '', hash);
}

export function initShell() {
  const match = location.hash.match(/^#\/app\/([\w-]+)/);
  openApp(match ? match[1] : DEFAULT_APP);
  window.addEventListener('hashchange', () => {
    const m = location.hash.match(/^#\/app\/([\w-]+)/);
    if (m && m[1] !== currentAppId.value) openApp(m[1]);
  });
  // Legacy event from apps that want to jump to chat.
  window.addEventListener('aios:open-chat', () => openApp('chat'));
}
