import { readBody } from '../../../shared/http/readBody.js';
import { json } from '../../../shared/http/json.js';
import { listResources } from '../../service/resources/list.js';
import { createResource } from '../../service/resources/create.js';
import { updateResource } from '../../service/resources/update.js';
import { deleteResource } from '../../service/resources/delete.js';

export const handleResourcesApi = async (req, res, path) => {
  if (path === '/api/resources' && req.method === 'GET') {
    return json(res, { items: listResources() });
  }

  if (path === '/api/resources/create' && req.method === 'POST') {
    const body = await readBody(req);
    const result = createResource(body);
    return json(res, { success: true, id: result.id });
  }

  if (path === '/api/resources/update' && req.method === 'POST') {
    const body = await readBody(req);
    updateResource(body);
    return json(res, { success: true });
  }

  if (path === '/api/resources/delete' && req.method === 'POST') {
    const body = await readBody(req);
    deleteResource(body);
    return json(res, { success: true });
  }

  return json(res, { error: 'API endpoint not found' }, 404);
};
