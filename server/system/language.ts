import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = join(import.meta.dirname, '..', '..');
const LANGUAGE_DIR = join(ROOT_DIR, 'language');
const UI_SRC_DIR = join(ROOT_DIR, 'ui', 'src');

const ALLOWED_LANGUAGES = new Set(['zh', 'en']);

const listFiles = (dir: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...listFiles(full));
      continue;
    }
    files.push(full);
  }
  return files;
};

const loadMessages = (lang: string) => {
  if (!ALLOWED_LANGUAGES.has(lang)) {
    throw new Error('语言不合法');
  }

  const langDir = join(LANGUAGE_DIR, lang);
  const stat = statSync(langDir);
  if (!stat.isDirectory()) {
    throw new Error(`语言目录不存在：${lang}`);
  }

  const messages: Record<string, string> = {};
  for (const file of listFiles(langDir)) {
    if (!file.endsWith('.json')) continue;
    Object.assign(messages, JSON.parse(readFileSync(file, 'utf8')));
  }
  return messages;
};

export const applyLanguage = (lang: string) => {
  const messages = loadMessages(lang);

  for (const file of listFiles(UI_SRC_DIR)) {
    if (!file.endsWith('.vue') && !file.endsWith('.ts')) continue;
    const content = readFileSync(file, 'utf8');
    const replaced = content.replace(/__T_([A-Z0-9_]+)__/g, (match, rawKey) => {
      const key = rawKey.toLowerCase();
      if (!(key in messages)) {
        throw new Error(`缺少语言键：${key}`);
      }
      return messages[key];
    });
    if (replaced !== content) {
      writeFileSync(file, replaced, 'utf8');
    }
  }

  rmSync(LANGUAGE_DIR, { recursive: true, force: true });
};
