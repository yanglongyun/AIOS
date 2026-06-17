// runTool 分发 · 所有 browser_* 工具汇总在这
//   语义工具(与 worker schema 对齐):browser_open / browser_read / browser_click / browser_fill / browser_screenshot
//   底层工具(备用):browser_status / browser_tabs / browser_navigate / browser_evaluate ...

import * as tabs from './tabs.js';
import { evaluate } from './evaluate.js';
import { screenshot } from './screenshot.js';

function waitComplete(tabId, timeout = 15000) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const iv = setInterval(async () => {
      try {
        const tb = await chrome.tabs.get(tabId);
        if (tb.status === 'complete' || Date.now() - t0 > timeout) { clearInterval(iv); resolve(); }
      } catch { clearInterval(iv); resolve(); }
    }, 300);
  });
}

// 打开网址(新标签,前台)· 等加载完成
async function browserOpen(args) {
  const url = String(args?.url || '').trim();
  if (!url) throw new Error('url_required');
  const full = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const tab = await chrome.tabs.create({ url: full, active: true });
  await waitComplete(tab.id);
  try { await chrome.windows.update(tab.windowId, { focused: true }); } catch {}
  return { ok: true, tabId: tab.id, url: full };
}

// 读取当前页可见文本
async function browserRead() {
  const r = await evaluate({ script: '(document.body && document.body.innerText || "").slice(0, 12000)' });
  return { text: r?.value || '' };
}

// 按选择器/文本点击
async function browserClick(args) {
  const sel = String(args?.selector || '').trim();
  if (!sel) throw new Error('selector_required');
  const script = `(() => {
    const s = ${JSON.stringify(sel)};
    let el = null;
    try { el = document.querySelector(s); } catch (e) {}
    if (!el) {
      const cands = [...document.querySelectorAll('a,button,[role=button],input[type=submit],[onclick]')];
      el = cands.find(e => (e.textContent || e.value || '').trim() === s)
        || cands.find(e => (e.textContent || e.value || '').includes(s));
    }
    if (!el) return { clicked: false };
    el.scrollIntoView({ block: 'center' });
    el.click();
    return { clicked: true, tag: el.tagName };
  })()`;
  const r = await evaluate({ script });
  if (!r?.value?.clicked) throw new Error(`未找到可点击元素: ${sel}`);
  return r.value;
}

// 往输入框填值
async function browserFill(args) {
  const sel = String(args?.selector || '').trim();
  const value = String(args?.value ?? '');
  if (!sel) throw new Error('selector_required');
  const script = `(() => {
    const el = document.querySelector(${JSON.stringify(sel)});
    if (!el) return { filled: false };
    el.focus();
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, ${JSON.stringify(value)}); else el.value = ${JSON.stringify(value)};
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return { filled: true };
  })()`;
  const r = await evaluate({ script });
  if (!r?.value?.filled) throw new Error(`未找到输入框: ${sel}`);
  return r.value;
}

const handlers = {
  // 语义工具(对齐 worker schema)
  browser_open:         browserOpen,
  browser_read:         browserRead,
  browser_click:        browserClick,
  browser_fill:         browserFill,
  browser_screenshot:   screenshot,
  // 底层工具(备用)
  browser_status:       tabs.status,
  browser_open_tab:     tabs.openTab,
  browser_tabs:         tabs.list,
  browser_activate_tab: tabs.activate,
  browser_close_tab:    tabs.close,
  browser_navigate:     tabs.navigate,
  browser_evaluate:     evaluate,
};

export async function runTool(name, args) {
  const fn = handlers[name];
  if (!fn) throw new Error(`unknown_tool: ${name}`);
  return fn(args || {});
}
