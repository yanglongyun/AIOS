import { json } from '../utils/json.js';
import { listFiles, readFile, getFileInfo } from './api/list.js';
import os from 'os';
import path from 'path';

function expandPath(dir) {
  const home = os.homedir();
  if (dir === '~') return home;
  if (dir.startsWith('~/')) return path.join(home, dir.slice(2));
  return dir;
}

export const handleFilesApi = async (req, res, pathname) => {
  if (pathname === '/api/apps/files/list' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const dir = url.searchParams.get('path') || '~';
    const expandedDir = expandPath(dir);
    return json(res, listFiles(expandedDir));
  }

  if (pathname === '/api/apps/files/read' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const filePath = url.searchParams.get('path');
    if (!filePath) return json(res, { error: '缺少 path' }, 400);
    const expandedPath = expandPath(filePath);
    return json(res, readFile(expandedPath));
  }

  if (pathname === '/api/apps/files/info' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const filePath = url.searchParams.get('path');
    if (!filePath) return json(res, { error: '缺少 path' }, 400);
    const expandedPath = expandPath(filePath);
    return json(res, getFileInfo(expandedPath));
  }

  return false;
};
