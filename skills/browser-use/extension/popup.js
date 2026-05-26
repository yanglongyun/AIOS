const stateLabels = {
  connected: '已连接',
  connecting: '连接中',
  reconnecting: '重连中',
  disconnected: '未连接',
};

const elements = {
  serviceUrl: document.getElementById('serviceUrl'),
  stateBadge: document.getElementById('stateBadge'),
  bridgeState: document.getElementById('bridgeState'),
  tabsTotal: document.getElementById('tabsTotal'),
  attachedTabs: document.getElementById('attachedTabs'),
  version: document.getElementById('version'),
  activeTitle: document.getElementById('activeTitle'),
  activeUrl: document.getElementById('activeUrl'),
  updatedAt: document.getElementById('updatedAt'),
  refreshButton: document.getElementById('refreshButton'),
};

function setText(key, value) {
  elements[key].textContent = value ?? '-';
}

function updateBadge(state) {
  const label = stateLabels[state] || '未知';
  elements.stateBadge.textContent = label;
  elements.stateBadge.className = 'badge';
  if (state === 'connected') elements.stateBadge.classList.add('ready');
  else if (state === 'connecting' || state === 'reconnecting') elements.stateBadge.classList.add('waiting');
  else elements.stateBadge.classList.add('offline');
}

function renderStatus(data) {
  updateBadge(data.bridge);
  setText('serviceUrl', data.serviceUrl);
  setText('bridgeState', stateLabels[data.bridge] || data.bridge);
  setText('tabsTotal', String(data.tabsTotal ?? 0));
  setText('attachedTabs', String(data.attachedTabs ?? 0));
  setText('version', data.version);
  setText('activeTitle', data.active?.title || '无活动标签页');
  setText('activeUrl', data.active?.url || '-');
  setText('updatedAt', new Date().toLocaleTimeString('zh-CN', { hour12: false }));
}

function renderError(error) {
  updateBadge('disconnected');
  setText('bridgeState', '读取失败');
  setText('serviceUrl', error || '无法读取插件状态');
  setText('tabsTotal', '-');
  setText('attachedTabs', '-');
  setText('version', chrome.runtime.getManifest().version);
  setText('activeTitle', '-');
  setText('activeUrl', '-');
  setText('updatedAt', new Date().toLocaleTimeString('zh-CN', { hour12: false }));
}

async function refreshStatus() {
  elements.refreshButton.disabled = true;
  try {
    const response = await chrome.runtime.sendMessage({ type: 'browser-use.popup-status' });
    if (!response?.ok) throw new Error(response?.error || 'status_unavailable');
    renderStatus(response.data);
  } catch (error) {
    renderError(error?.message || String(error));
  } finally {
    elements.refreshButton.disabled = false;
  }
}

elements.refreshButton.addEventListener('click', refreshStatus);
refreshStatus();
