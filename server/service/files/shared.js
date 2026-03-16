import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, '..', '..', '..');
export const FILES_DIR = join(ROOT, 'files');

export const MAX_SIZE = 10 * 1024 * 1024;

export const ALLOWED_EXT = new Set([
  '.txt', '.md', '.pdf', '.doc', '.docx', '.json', '.csv',
  '.png', '.jpg', '.jpeg', '.webp', '.log', '.pptx', '.xlsx'
]);

export const safeName = (name = 'file') =>
  String(name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file';

export const safePath = (sub) => {
  if (!sub) return ROOT;
  const full = sub.startsWith('/') ? resolve(sub) : resolve(ROOT, sub);
  return full;
};
