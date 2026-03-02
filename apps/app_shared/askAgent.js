import { parseJsonObject } from './utils/parseJsonObject.js';

export const askAgent = async ({ app, prompt }) => {
  const resp = await fetch('http://localhost:9700/api/ask', {
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

export const askAgentJson = async ({ app, prompt }) => {
  const data = await askAgent({ app, prompt });
  return parseJsonObject(data.response || '');
};
