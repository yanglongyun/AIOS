import { mkdir, writeFile } from 'fs/promises';
import { extname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '../../../../..');
const UPLOAD_DIR = join(ROOT, 'files', 'uploads', 'doodle');
const MAX_SIZE = 8 * 1024 * 1024;
const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);

export const uploadHandler = async (body = {}) => {
  const fileName = String(body.name || '').trim();
  const base64 = String(body.data || '').trim();
  if (!fileName || !base64) return { status: 400, message: 'name and data are required' };

  const ext = extname(fileName).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) return { status: 400, message: `file type not allowed: ${ext}` };

  const normalized = base64.replace(/^data:.*;base64,/, '');
  const buffer = Buffer.from(normalized, 'base64');
  if (!buffer.length) return { status: 400, message: 'empty image' };
  if (buffer.length > MAX_SIZE) return { status: 400, message: 'image too large (max 8MB)' };

  await mkdir(UPLOAD_DIR, { recursive: true });
  const savedName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const absPath = join(UPLOAD_DIR, savedName);
  await writeFile(absPath, buffer);

  return { success: true, image: { name: fileName, path: absPath } };
};
