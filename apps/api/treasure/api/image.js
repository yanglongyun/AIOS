import { existsSync, readFileSync } from 'fs';
import { extname } from 'path';
import { db } from '../../../db/client.js';

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

export const imageHandler = (res, query = {}) => {
  const id = Number(query.id || 0);
  if (!id) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, message: '缺少 id' }));
    return true;
  }

  const row = db.prepare('SELECT image_path FROM apps_treasures WHERE id = ?').get(id);
  if (!row?.image_path || !existsSync(row.image_path)) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, message: '图片不存在' }));
    return true;
  }

  const ext = extname(row.image_path).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(readFileSync(row.image_path));
  return true;
};
