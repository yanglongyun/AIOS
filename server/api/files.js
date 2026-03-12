import { createReadStream } from 'fs';
import { mkdir, readdir, stat, unlink, writeFile } from 'fs/promises';
import { basename, dirname, extname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { readBody } from '../../shared/http/readBody.js';
import { json } from '../../shared/http/json.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const FILES_DIR = join(ROOT, 'files');
const UPLOAD_DIR = join(ROOT, 'files', 'uploads', 'chat');
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXT = new Set([
  '.txt', '.md', '.pdf', '.doc', '.docx', '.json', '.csv',
  '.png', '.jpg', '.jpeg', '.webp', '.log', '.pptx', '.xlsx'
]);

const MIME_MAP = {
  '.txt': 'text/plain', '.md': 'text/markdown', '.pdf': 'application/pdf',
  '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.json': 'application/json', '.csv': 'text/csv',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.log': 'text/plain', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

const safeName = (name = 'file') =>
  String(name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file';

// 解析路径（支持绝对路径和相对于项目根的路径）
const safePath = (sub) => {
  if (!sub) return ROOT;
  // 绝对路径直接用，相对路径基于项目根
  const full = sub.startsWith('/') ? resolve(sub) : resolve(ROOT, sub);
  return full;
};

const uploadHandler = async (body = {}) => {
  const fileName = String(body.name || '').trim();
  const base64 = String(body.data || '').trim();
  const dir = String(body.dir || 'uploads/chat').trim();
  if (!fileName || !base64) return { status: 400, message: 'name and data are required' };

  const ext = extname(fileName).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) return { status: 400, message: `file type not allowed: ${ext || '(none)'}` };

  let buffer = null;
  try {
    const normalized = base64.replace(/^data:.*;base64,/, '');
    buffer = Buffer.from(normalized, 'base64');
  } catch { return { status: 400, message: 'invalid base64 data' }; }
  if (!buffer || buffer.length === 0) return { status: 400, message: 'empty file data' };
  if (buffer.length > MAX_SIZE) return { status: 400, message: 'file too large (max 10MB)' };

  const targetDir = safePath(dir);
  if (!targetDir) return { status: 400, message: 'invalid directory' };

  await mkdir(targetDir, { recursive: true });
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const savedName = `${ts}-${rand}-${safeName(fileName)}`;
  const absPath = join(targetDir, savedName);
  await writeFile(absPath, buffer);

  return { success: true, file: { name: fileName, path: absPath, size: buffer.length } };
};

const listHandler = async (dir = '') => {
  const full = safePath(dir);
  if (!full) return { status: 400, message: 'invalid path' };

  let entries;
  try { entries = await readdir(full, { withFileTypes: true }); }
  catch { return { success: true, data: [], path: dir }; }

  const items = [];
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const itemPath = join(full, e.name);
    try {
      const s = await stat(itemPath);
      items.push({
        name: e.name,
        type: e.isDirectory() ? 'dir' : 'file',
        size: e.isDirectory() ? 0 : s.size,
        modified: s.mtime.toISOString()
      });
    } catch { /* skip */ }
  }
  items.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return { success: true, data: items, path: dir, root: ROOT };
};

const deleteHandler = async (filePath = '') => {
  const full = safePath(filePath);
  if (!full || full === ROOT) return { status: 400, message: 'invalid path' };
  try {
    const s = await stat(full);
    if (s.isDirectory()) return { status: 400, message: 'cannot delete directory' };
    await unlink(full);
    return { success: true };
  } catch { return { status: 404, message: 'file not found' }; }
};

const downloadHandler = (res, filePath = '') => {
  const full = safePath(filePath);
  if (!full) { json(res, { success: false, message: 'invalid path' }, 400); return; }

  const ext = extname(full).toLowerCase();
  const mime = MIME_MAP[ext] || 'application/octet-stream';
  const name = basename(full);

  res.writeHead(200, {
    'Content-Type': mime,
    'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}"`,
  });
  createReadStream(full).pipe(res);
};

export const handleFilesApi = async (req, res, path) => {
  if (path === '/api/files/upload' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await uploadHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/files/list' && req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const dir = url.searchParams.get('dir') || '';
    const data = await listHandler(dir);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/files/delete' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await deleteHandler(body?.path);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/files/download' && req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const filePath = url.searchParams.get('path') || '';
    downloadHandler(res, filePath);
    return;
  }

  return json(res, { success: false, message: 'API endpoint not found' }, 404);
};
