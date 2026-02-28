import { mkdir, writeFile } from 'fs/promises';
import { dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..', '..');
const UPLOAD_DIR = join(ROOT, 'uploads', 'chat');
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXT = new Set([
  '.txt', '.md', '.pdf', '.doc', '.docx', '.json', '.csv',
  '.png', '.jpg', '.jpeg', '.webp', '.log'
]);

const safeName = (name = 'file') =>
  String(name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file';

export const uploadHandler = async (body = {}) => {
  const fileName = String(body.name || '').trim();
  const base64 = String(body.data || '').trim();
  if (!fileName || !base64) {
    return { status: 400, message: 'name and data are required' };
  }

  const ext = extname(fileName).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return { status: 400, message: `file type not allowed: ${ext || '(none)'}` };
  }

  let buffer = null;
  try {
    const normalized = base64.replace(/^data:.*;base64,/, '');
    buffer = Buffer.from(normalized, 'base64');
  } catch {
    return { status: 400, message: 'invalid base64 data' };
  }
  if (!buffer || buffer.length === 0) return { status: 400, message: 'empty file data' };
  if (buffer.length > MAX_SIZE) return { status: 400, message: 'file too large (max 10MB)' };

  await mkdir(UPLOAD_DIR, { recursive: true });
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const savedName = `${ts}-${rand}-${safeName(fileName)}`;
  const absPath = join(UPLOAD_DIR, savedName);

  await writeFile(absPath, buffer);

  return {
    success: true,
    file: {
      name: fileName,
      path: absPath,
      size: buffer.length
    }
  };
};
