import Database from 'better-sqlite3';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const db = new Database(resolve(__dirname, '..', '..', 'database', 'aios.db'));
