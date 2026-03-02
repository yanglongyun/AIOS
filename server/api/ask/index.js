import { json } from '../utils/json.js';
import { readBody } from '../utils/readBody.js';
import { listAskRecords } from './list.js';
import { createAsk } from './create.js';

export const handleAskApi = async (req, res, path, url) => {
  if (path === '/api/ask' && req.method === 'GET') {
    const limit = Number(url.searchParams.get('limit') || 20);
    return json(res, listAskRecords({ limit }));
  }

  if (path === '/api/ask' && req.method === 'POST') {
    const { app, prompt } = await readBody(req);
    const result = await createAsk({ app, prompt });
    return json(res, result);
  }

  json(res, { error: 'not found' }, 404);
};
