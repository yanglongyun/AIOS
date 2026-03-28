import Database from 'better-sqlite3';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..', '..');
const aiosDbPath = resolve(root, 'database', 'aios.db');

const aiosDb = new Database(aiosDbPath, { readonly: true, fileMustExist: true });

export const hasSystemLanguage = () => {
  const row = aiosDb.prepare("SELECT value FROM settings WHERE key = 'language'").get();
  const language = String(row?.value || '').trim();
  return language === 'zh' || language === 'en';
};

export const getSystemLanguage = () => {
  const row = aiosDb.prepare("SELECT value FROM settings WHERE key = 'language'").get();
  const language = String(row?.value || '').trim();
  if (!language) {
    throw new Error('Missing settings.language in database/aios.db');
  }
  if (language !== 'zh' && language !== 'en') {
    throw new Error(`Invalid settings.language: ${language}`);
  }
  return language;
};
