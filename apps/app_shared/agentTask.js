import { parseJsonObject } from '../../shared/ai/json.js';

const requestTask = async (body = {}) => {
  let resp;
  try {
    resp = await fetch('http://localhost:9700/api/task/create/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (err) {
    throw new Error(`task service unreachable: ${err.message}`);
  }
  let data;
  try { data = await resp.json(); } catch { data = {}; }
  if (!resp.ok || data.success === false) {
    throw new Error(data.message || data.error || `request failed ${resp.status}`);
  }
  return data;
};

export const agentTask = async ({ app, title, prompt, meta = null }) => {
  return await requestTask({
    app,
    title,
    prompt,
    meta
  });
};

export const agentTaskJson = async (args = {}) => {
  const data = await agentTask(args);
  return parseJsonObject(data.response || '');
};
