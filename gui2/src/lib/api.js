// 极简 HTTP 客户端 + 401 钩子.浏览器走 cookie session.
let on401 = null;
export function setOn401(fn) { on401 = typeof fn === 'function' ? fn : null; }

async function handle(res) {
  if (res.ok) {
    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : res.text();
  }
  const err = new Error(`${res.status} ${res.statusText}`);
  err.status = res.status;
  try { err.body = await res.json(); } catch { try { err.body = await res.text(); } catch {} }
  if (res.status === 401 && on401) on401();
  throw err;
}

function qstr(query) {
  if (!query) return '';
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    u.set(k, String(v));
  }
  const s = u.toString();
  return s ? '?' + s : '';
}

export async function get(url, { query } = {}) {
  return handle(await fetch(url + qstr(query)));
}
export async function post(url, body) {
  return handle(await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  }));
}
export async function del(url, { query } = {}) {
  return handle(await fetch(url + qstr(query), { method: 'DELETE' }));
}
export async function postMultipart(url, formData) {
  return handle(await fetch(url, { method: 'POST', body: formData }));
}
