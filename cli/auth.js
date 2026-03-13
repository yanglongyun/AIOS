import readline from 'readline';
import { API_URL } from './config.js';
import t from './locale.js';

let authCookie = '';

const readJsonSafe = async (res) => {
  try { return await res.json(); } catch { return {}; }
};

const getSetCookieHeader = (res) => {
  if (typeof res?.headers?.getSetCookie === 'function') {
    const values = res.headers.getSetCookie();
    if (Array.isArray(values) && values.length > 0) return values[0];
  }
  return res?.headers?.get?.('set-cookie') || '';
};

const pickCookiePair = (setCookie = '') => {
  const first = String(setCookie).split(';')[0].trim();
  return first || '';
};

const ask = (question) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(question, (answer) => { rl.close(); resolve(String(answer || '').trim()); });
});

const login = async () => {
  const username = await ask(t.askUsername);
  const password = await ask(t.askPassword);

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await readJsonSafe(res);
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || t.loginFailed);
  }

  const cookiePair = pickCookiePair(getSetCookieHeader(res));
  if (!cookiePair) throw new Error(t.noCookie);
  authCookie = cookiePair;
};

export const ensureAuth = async () => {
  if (!authCookie) { await login(); return; }
  const res = await fetch(`${API_URL}/auth/me`, { method: 'GET', headers: { cookie: authCookie } });
  if (res.ok) return;
  await login();
};

export const getAuthCookie = () => authCookie;
