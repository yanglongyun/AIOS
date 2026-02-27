import { json } from '../utils/json.js';
import { listFiles, readFile, getFileInfo } from './api/list.js';

export const handleFilesApi = async (req, res, path) => {
  if (path === '/api/apps/files/list' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const dir = url.searchParams.get('path') || process.env.HOME || '/';
    return json(res, listFiles(dir));
  }

  if (path === '/api/apps/files/read' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const filePath = url.searchParams.get('path');
    if (!filePath) return json(res, { error: '缺少 path' }, 400);
    return json(res, readFile(filePath));
  }

  if (path === '/api/apps/files/info' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const filePath = url.searchParams.get('path');
    if (!filePath) return json(res, { error: '缺少 path' }, 400);
    return json(res, getFileInfo(filePath));
  }

  return false;
};
