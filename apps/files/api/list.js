import fs from 'fs';
import path from 'path';

const PREVIEW_EXTS = new Set(['.txt', '.md', '.json', '.js', '.ts', '.css', '.html', '.sh', '.env', '.yaml', '.yml', '.toml', '.xml', '.csv', '.log']);
const MAX_PREVIEW_SIZE = 100 * 1024; // 100KB

export const listFiles = (dir) => {
  try {
    const resolved = path.resolve(dir);
    const entries = fs.readdirSync(resolved, { withFileTypes: true });
    const items = entries.map((e) => {
      const fullPath = path.join(resolved, e.name);
      let size = null;
      let mtime = null;
      try {
        const stat = fs.statSync(fullPath);
        size = stat.size;
        mtime = stat.mtime.toISOString();
      } catch {}
      return {
        name: e.name,
        path: fullPath,
        isDir: e.isDirectory(),
        isSymlink: e.isSymbolicLink(),
        size,
        mtime,
        ext: e.isDirectory() ? null : path.extname(e.name).toLowerCase()
      };
    });
    // 目录在前，文件在后，各自按名称排序
    items.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return { path: resolved, parent: path.dirname(resolved), items };
  } catch (e) {
    return { error: e.message };
  }
};

export const readFile = (filePath) => {
  try {
    const resolved = path.resolve(filePath);
    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) return { error: '不能读取目录' };
    if (stat.size > MAX_PREVIEW_SIZE) return { error: `文件过大（${(stat.size / 1024).toFixed(1)}KB），超过预览限制` };
    const ext = path.extname(resolved).toLowerCase();
    if (!PREVIEW_EXTS.has(ext)) return { error: `不支持预览该文件类型（${ext || '无扩展名'}）` };
    const content = fs.readFileSync(resolved, 'utf8');
    return { path: resolved, content, size: stat.size, mtime: stat.mtime.toISOString() };
  } catch (e) {
    return { error: e.message };
  }
};

export const getFileInfo = (filePath) => {
  try {
    const resolved = path.resolve(filePath);
    const stat = fs.statSync(resolved);
    return {
      path: resolved,
      name: path.basename(resolved),
      isDir: stat.isDirectory(),
      size: stat.size,
      mtime: stat.mtime.toISOString(),
      ctime: stat.ctime.toISOString(),
      ext: path.extname(resolved).toLowerCase()
    };
  } catch (e) {
    return { error: e.message };
  }
};
