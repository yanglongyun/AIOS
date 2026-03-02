import { json } from '../utils/json.js';
import { readBody } from '../utils/readBody.js';
import { listRequests } from './list.js';
import { createRequest } from './create.js';

export const handleRequestsApi = async (req, res, path, url) => {
  if (path === '/api/requests' && req.method === 'GET') {
    const limit = Number(url.searchParams.get('limit') || 20);
    return json(res, listRequests({ limit }));
  }

  if (path === '/api/requests' && req.method === 'POST') {
    const { app, prompt } = await readBody(req);
    const result = await createRequest({ app, prompt });
    return json(res, result);
  }

  json(res, { error: 'not found' }, 404);
};
