// Shared fetch helpers + time/status formatters for the tasks app.

// --- fetch ---

export const request = async (url, opts = {}) => {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
};

export const fetchTasks = async (limit = 200) => {
  const r = await fetch(`/api/tasks?limit=${limit}`);
  const data = await r.json().catch(() => ({}));
  return data.tasks || [];
};

export const fetchTaskDetail = (id) => request(`/api/tasks?id=${id}`);

export const abortTask = (id) =>
  request(`/api/tasks?id=${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'aborted' }),
  });

// --- status helpers ---

export const isActive = (status) => status === 'pending' || status === 'running';
export const isDone = (status) => status === 'done' || status === 'completed';
export const isFailed = (status) => !isActive(status) && !isDone(status);

// --- time formatters ---
// created_at / finished_at are UTC "YYYY-MM-DD HH:MM:SS" strings from sqlite datetime('now')

export const parseTime = (s) => {
  if (!s) return null;
  const d = new Date(String(s).replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? null : d;
};

export const dayKey = (d) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (d.getTime() >= startOfToday) return 'today';
  if (d.getTime() >= startOfToday - 86400000) return 'yesterday';
  return 'earlier';
};

export const relTime = (s) => {
  const d = parseTime(s);
  if (!d) return '';
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const sameDay = dayKey(d) === 'today';
  return sameDay ? `${hh}:${mm}` : `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
};

export const fmtTime = (s) => {
  const d = parseTime(s);
  if (!d) return s;
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
