import { json } from '../../shared/http/json.js';

export const handleLlmApi = (req, res, path) => {
  if (path === '/api/llm/env' && req.method === 'GET') {
    const ready = !!(process.env.LITELLM_KEY && process.env.LITELLM_URL);
    json(res, { ready });
    return;
  }
  json(res, { error: 'not found' }, 404);
};
