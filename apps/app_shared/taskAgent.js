import { parseJsonObject } from './utils/parseJsonObject.js';

export const taskAgent = async ({ app, prompt, req }) => {
  const cookie = typeof req?.headers?.cookie === 'string' ? req.headers.cookie : '';
  const resp = await fetch('http://localhost:9700/api/task', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {})
    },
    body: JSON.stringify({ app, prompt })
  });
  const data = await resp.json();
  if (!resp.ok || data.success === false) {
    throw new Error(data.message || data.error || `request failed ${resp.status}`);
  }
  return data;
};

export const taskAgentJson = async ({ app, prompt, req }) => {
  const data = await taskAgent({ app, prompt, req });
  return parseJsonObject(data.response || '');
};
