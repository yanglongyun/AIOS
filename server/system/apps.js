import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const APPS_ROOT = join(process.cwd(), 'apps');

const parseReadme = (filePath) => {
  if (!existsSync(filePath)) return null;
  const text = readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);

  let fmName = '';
  let fmDescription = '';
  if (lines[0]?.trim() === '---') {
    let i = 1;
    for (; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '---') break;
      if (line.startsWith('name:')) fmName = line.replace(/^name:\s*/, '').trim();
      if (line.startsWith('description:')) fmDescription = line.replace(/^description:\s*/, '').trim();
    }
  }
  if (!fmName && !fmDescription) return null;
  return { title: fmName, summary: fmDescription };
};

export const getAppsCatalog = () => {
  if (!existsSync(APPS_ROOT)) return [];

  const apps = [];
  for (const name of readdirSync(APPS_ROOT)) {
    const dir = join(APPS_ROOT, name);
    let isDir = false;
    try {
      isDir = statSync(dir).isDirectory();
    } catch {
      isDir = false;
    }
    if (!isDir) continue;

    const meta = parseReadme(join(dir, 'APP.md'));
    if (!meta) continue;
    apps.push({
      id: name,
      title: meta.title || name,
      summary: meta.summary || ''
    });
  }

  apps.sort((a, b) => a.id.localeCompare(b.id));
  return apps;
};
