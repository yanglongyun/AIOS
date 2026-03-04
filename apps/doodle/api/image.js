import { existsSync, readFileSync } from 'fs';
import { extname } from 'path';
import { db } from '../db.js';

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

export const imageHandler = (res, query = {}) => {
  const id = Number(query.id || 0);
  if (!id) { res.writeHead(400); res.end('missing id'); return true; }

  const row = db.prepare('SELECT original_path FROM apps_doodle_works WHERE id = ?').get(id);
  if (!row?.original_path || !existsSync(row.original_path)) {
    res.writeHead(404); res.end('not found'); return true;
  }

  const ext = extname(row.original_path).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(readFileSync(row.original_path));
  return true;
};
