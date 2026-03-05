import { parseJsonObject } from './utils/parseJsonObject.js';

const requestTask = async (body = {}, req) => {
  const cookie = typeof req?.headers?.cookie === 'string' ? req.headers.cookie : '';
  const resp = await fetch('http://localhost:9700/api/task', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {})
    },
    body: JSON.stringify(body)
  });
  const data = await resp.json();
  if (!resp.ok || data.success === false) {
    throw new Error(data.message || data.error || `request failed ${resp.status}`);
  }
  return data;
};

export const agentTask = async ({ app, title, prompt, req, meta = null }) => {
  return await requestTask({
    app,
    title,
    mode: 'agent',
    prompt,
    meta
  }, req);
};

export const agentTaskJson = async (args = {}) => {
  const data = await agentTask(args);
  return parseJsonObject(data.response || '');
};
