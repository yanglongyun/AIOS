const $ = (id) => document.getElementById(id);

function send(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => resolve(response));
  });
}

function formatTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('zh-CN', { hour12: false });
  } catch {
    return iso;
  }
}

async function refresh() {
  const response = await send({ type: 'agent.browser.status' });
  const data = response?.data;
  if (!data) return;

  $('ver').textContent = data.version || '?';
  $('dot').className = `dot ${data.bridge}`;
  $('state-text').textContent = {
    connected: '已连接 · 等待 AGENT 调用',
    connecting: '连接中…',
    reconnecting: '断开 · 重连中',
    disconnected: '未连接',
  }[data.bridge] || data.bridge;

  const info = [`服务 · ${data.serviceUrl}`];
  if (data.lastConnectedAt) info.push(`上次连接 · ${formatTime(data.lastConnectedAt)}`);
  if (data.lastError && data.bridge !== 'connected') info.push(`错误 · ${data.lastError}`);
  $('info').textContent = info.join('\n');
}

document.addEventListener('DOMContentLoaded', () => {
  $('btn-reconnect').addEventListener('click', async () => {
    $('btn-reconnect').disabled = true;
    await send({ type: 'agent.browser.reconnect' });
    window.setTimeout(() => {
      $('btn-reconnect').disabled = false;
      refresh();
    }, 500);
  });

  refresh();
  setInterval(refresh, 2000);
});
