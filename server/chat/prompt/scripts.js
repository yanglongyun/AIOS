import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SCRIPTS_ROOT = join(process.cwd(), 'scripts');

const stripQuotes = (value) => {
  const text = String(value || '').trim();
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1).trim();
  }
  return text;
};

const parseScriptMeta = (filePath) => {
  if (!existsSync(filePath)) return null;

  const text = readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') return null;

  const meta = {
    name: '',
    description: '',
    usage: '',
    visibility: false
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '---') break;

    const sep = line.indexOf(':');
    if (sep <= 0) continue;

    const key = line.slice(0, sep).trim();
    const value = stripQuotes(line.slice(sep + 1));
    if (key === 'name') meta.name = value;
    if (key === 'description') meta.description = value;
    if (key === 'usage') meta.usage = value;
    if (key === 'visibility') meta.visibility = value.toLowerCase() === 'true';
  }

  if (!meta.visibility) return null;
  if (!meta.name && !meta.description && !meta.usage) return null;
  return meta;
};

export const scripts = () => {
  if (!existsSync(SCRIPTS_ROOT)) return '';

  const list = [];
  for (const name of readdirSync(SCRIPTS_ROOT)) {
    const dir = join(SCRIPTS_ROOT, name);
    let isDir = false;
    try {
      isDir = statSync(dir).isDirectory();
    } catch {
      isDir = false;
    }
    if (!isDir) continue;

    const meta = parseScriptMeta(join(dir, 'SCRIPT.md'));
    if (!meta) continue;
    list.push(meta);
  }
  list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

  if (!Array.isArray(list) || list.length === 0) return '';

  const lines = list.map((script, i) => {
    return `${i + 1}. name: ${script.name || '-'} | description: ${
      script.description || '-'
    } | usage: ${script.usage || '-'}`;
  });
  return `\n\n## 可见脚本
以下脚本已标记为可见，可按需建议用户使用（仅展示 name/description/usage）：\n${lines.join('\n')}`;
};
