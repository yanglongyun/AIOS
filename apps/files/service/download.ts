import { createReadStream } from 'fs';
import { basename, extname } from 'path';
import { safePath } from './shared.ts';
import { json } from '../../../shared/http/json.ts';

const MIME_MAP = {
  '.txt': 'text/plain', '.md': 'text/markdown', '.pdf': 'application/pdf',
  '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.json': 'application/json', '.csv': 'text/csv',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.log': 'text/plain', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

export const download = (res, filePath = '') => {
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
