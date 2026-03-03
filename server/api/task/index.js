import { json } from '../utils/json.js';
import { readBody } from '../utils/readBody.js';
import { listTaskRecords } from './list.js';
import { createTask } from './create.js';

export const handleTaskApi = async (req, res, path, url) => {
  if (path === '/api/task' && req.method === 'GET') {
    const limit = Number(url.searchParams.get('limit') || 20);
    return json(res, listTaskRecords({ limit }));
  }

  if (path === '/api/task' && req.method === 'POST') {
    const { app, prompt } = await readBody(req);
    const result = await createTask({ app, prompt });
    return json(res, result);
  }

  json(res, { error: 'not found' }, 404);
};
