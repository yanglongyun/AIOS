import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { ROOT, safePath } from './shared.js';

export const list = async (dir = '') => {
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
