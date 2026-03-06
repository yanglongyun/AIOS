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

export const apps = () => {
  if (!existsSync(APPS_ROOT)) {
    return `\n\n## 应用目录\n你可以帮助用户构建应用、使用应用、管理应用。`;
  }

  const list = [];
  for (const name of readdirSync(APPS_ROOT)) {
    if (name === 'app_shared') continue;
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
    list.push({
      id: name,
      title: meta.title || name,
      summary: meta.summary || ''
    });
  }
  list.sort((a, b) => a.id.localeCompare(b.id));

  if (!Array.isArray(list) || list.length === 0) {
    return `\n\n## 应用目录\n你可以帮助用户构建应用、使用应用、管理应用。`;
  }
  const lines = list.map((app, i) => {
    const summary = app.summary ? ` - ${app.summary}` : '';
    return `${i + 1}. ${app.id} | ${app.title}${summary}`;
  });
  return `\n\n## 应用目录\n你可以帮助用户构建应用、使用应用、管理应用。\n${lines.join('\n')}`;
};
