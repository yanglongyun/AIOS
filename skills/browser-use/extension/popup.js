const stateLabels = {
  connected: '已连接',
  connecting: '连接中',
  reconnecting: '重连中',
  disconnected: '未连接',
};

const startCommand = 'cd /Users/woodchange/Desktop/AIOS && bash skills/browser-use/scripts/start-service.sh';
const aiPrompt = '请在 /Users/woodchange/Desktop/AIOS 启动 AIOS 的 browser-use 本机服务：bash skills/browser-use/scripts/start-service.sh。启动后告诉我服务状态。';

const elements = {
  serviceUrl: document.getElementById('serviceUrl'),
  stateBadge: document.getElementById('stateBadge'),
  activeTitle: document.getElementById('activeTitle'),
  activeUrl: document.getElementById('activeUrl'),
  updatedAt: document.getElementById('updatedAt'),
  refreshButton: document.getElementById('refreshButton'),
  setupPanel: document.getElementById('setupPanel'),
  startCommand: document.getElementById('startCommand'),
  aiPrompt: document.getElementById('aiPrompt'),
  copyCommandButton: document.getElementById('copyCommandButton'),
  copyPromptButton: document.getElementById('copyPromptButton'),
  copyNotice: document.getElementById('copyNotice'),
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
  const serviceReady = Boolean(data.service?.reachable);
  document.body.dataset.service = serviceReady ? 'ready' : 'offline';
  setText('serviceUrl', data.serviceHttpUrl || data.serviceUrl);
  setText('activeTitle', data.active?.title || '无活动标签页');
  setText('activeUrl', data.active?.url || '-');
  setText('updatedAt', new Date().toLocaleTimeString('zh-CN', { hour12: false }));
  elements.setupPanel.hidden = serviceReady && data.bridge === 'connected';
  setText('copyNotice', '');
}

function renderError(error) {
  updateBadge('disconnected');
  document.body.dataset.service = 'offline';
  setText('serviceUrl', error || '无法读取插件状态');
  setText('activeTitle', '-');
  setText('activeUrl', '-');
  setText('updatedAt', new Date().toLocaleTimeString('zh-CN', { hour12: false }));
  elements.setupPanel.hidden = false;
}

async function copyText(text, label) {
  await navigator.clipboard.writeText(text);
  setText('copyNotice', `${label}已复制`);
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

elements.startCommand.textContent = startCommand;
elements.aiPrompt.textContent = aiPrompt;
elements.refreshButton.addEventListener('click', refreshStatus);
elements.copyCommandButton.addEventListener('click', () => copyText(startCommand, '启动命令'));
elements.copyPromptButton.addEventListener('click', () => copyText(aiPrompt, '提示词'));
refreshStatus();
