// AGENT 浏览器连接器 popup
//   · 填配置 → background 写 chrome.storage.local
//   · 已连接 → 显示与本地 AGENT 的连接状态

const $ = (id) => document.getElementById(id);

// ── 主题(暗/亮)──
const THEME_KEY = 'meem_theme';
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem(THEME_KEY, t); } catch { /* */ }
}
function initTheme() {
  applyTheme(localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark');
}
function toggleTheme() {
  applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
}
initTheme();

function send(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (r) => resolve(r));
  });
}

async function refresh() {
  const r = await send({ type: 'meem.popup-status' });
  const data = r?.data;
  if (!data) return;

  $('ver').textContent = data.version || '?';
  const site = data.base || '#';
  $('site-link').href = site;
  $('site-link').textContent = site === '#' ? '打开 AGENT' : `打开 ${site.replace(/^https?:\/\//, '')}`;

  // 未连接时,用已存的 base/ws/device 预填表单(token 不回填)
  if (!data.configured) {
    if ($('in-base') && !$('in-base').value && data.base) $('in-base').value = data.base;
    if ($('in-ws') && !$('in-ws').value && data.ws) $('in-ws').value = data.ws;
  }

  if (data.configured) {
    $('view-status').hidden = false;
    $('view-auth').hidden = true;

    const dot = $('dot');
    dot.className = 'dot ' + data.bridge;
    const text = {
      connected: '已连接 · 等待 AI 调用',
      connecting: '连接中…',
      reconnecting: '断开 · 重连中',
      disconnected: '未连接',
    }[data.bridge] || data.bridge;
    $('state-text').textContent = text;

    const info = [];
    if (data.lastConnectedAt) info.push(`上次连接 · ${formatTime(data.lastConnectedAt)}`);
    if (data.lastError && data.bridge !== 'connected') info.push(`错误 · ${data.lastError}`);
    $('info').textContent = info.join('\n');
  } else {
    $('view-status').hidden = true;
    $('view-auth').hidden = false;
  }
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toTimeString().slice(0, 8);
  } catch { return iso; }
}

function showError(msg) {
  const el = $('error');
  if (!msg) { el.hidden = true; el.textContent = ''; return; }
  el.hidden = false;
  el.textContent = msg;
}

document.addEventListener('DOMContentLoaded', () => {
  $('form-auth').addEventListener('submit', async (e) => {
    e.preventDefault();
    const base = $('in-base').value.trim();
    const ws = $('in-ws').value.trim();
    const token = $('in-token').value.trim();
    if (!token) return showError('请粘贴令牌 Token');
    if (!ws) return showError('请填写 WebSocket 地址');

    const btn = $('btn-submit');
    btn.disabled = true;
    showError('');
    try {
      const r = await send({ type: 'meem.connect', config: { base, ws, token } });
      if (!r?.ok) { showError(r?.error || '连接失败'); return; }
      $('in-token').value = '';
      await refresh();
    } finally {
      btn.disabled = false;
    }
  });

  $('btn-logout').addEventListener('click', async () => {
    await send({ type: 'meem.logout' });
    setTimeout(refresh, 100);
  });

  $('btn-theme').addEventListener('click', toggleTheme);

  refresh();
  // 状态轮询(同时让 popup 一直保持 background 活着)
  setInterval(refresh, 2000);
});
