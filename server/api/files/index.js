import { readBody } from '../../../shared/http/readBody.js';
import { json } from '../../../shared/http/json.js';
import { uploadHandler } from './upload.js';

export const handleFilesApi = async (req, res, path) => {
  if (path === '/api/files/upload' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await uploadHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return json(res, { success: false, message: 'API endpoint not found' }, 404);
};
