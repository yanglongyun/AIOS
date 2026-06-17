// @ts-nocheck
// 每个 app 一个独立的 SQLite 文件,落在 data/apps/ 下,互不污染。
import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPS_DB_DIR = path.resolve(__dirname, "../../../data/apps");

const createAppDb = (filename) => {
  fs.mkdirSync(APPS_DB_DIR, { recursive: true });
  const db = new DatabaseSync(path.join(APPS_DB_DIR, filename));
  db.exec("PRAGMA journal_mode = WAL");
  return db;
};

export { createAppDb, APPS_DB_DIR };
