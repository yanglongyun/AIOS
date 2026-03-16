import { readBody } from '../../shared/http/readBody.js';
import { json } from '../../shared/http/json.js';
import { upload } from '../service/files/upload.js';
import { list } from '../service/files/list.js';
import { remove } from '../service/files/delete.js';
import { download } from '../service/files/download.js';

export const handleFilesApi = async (req, res, path) => {
  if (path === '/api/files/upload' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await upload(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/files/list' && req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const dir = url.searchParams.get('dir') || '';
    const data = await list(dir);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/files/delete' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await remove(body?.path);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/files/download' && req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const filePath = url.searchParams.get('path') || '';
    download(res, filePath);
    return;
  }

  return json(res, { success: false, message: 'API endpoint not found' }, 404);
};
