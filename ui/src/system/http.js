// 应用 HTTP 客户端:本机、无登录、无 token。
// 约定:应用后端返回 { ok, ... };ok:false 或非 2xx 抛错(取 error 文案)。
// 各应用 lib/api.js 用它封装自己的端点函数。

export const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

const withJson = (method) => (url, body) => request(url, {
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const getJson = (url) => request(url);
export const postJson = withJson('POST');
export const patchJson = withJson('PATCH');
export const putJson = withJson('PUT');
export const delJson = (url) => request(url, { method: 'DELETE' });
export const postForm = (url, formData) => request(url, { method: 'POST', body: formData });
