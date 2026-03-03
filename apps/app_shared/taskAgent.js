import { parseJsonObject } from './utils/parseJsonObject.js';

export const taskAgent = async ({ app, prompt }) => {
  const resp = await fetch('http://localhost:9700/api/task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app, prompt })
  });
  const data = await resp.json();
  if (!resp.ok || data.success === false) {
    throw new Error(data.message || data.error || `request failed ${resp.status}`);
  }
  return data;
};

export const taskAgentJson = async ({ app, prompt }) => {
  const data = await taskAgent({ app, prompt });
  return parseJsonObject(data.response || '');
};
