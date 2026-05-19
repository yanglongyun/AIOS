import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, "..", "..", "..", "database", "aios.db");
mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
// WAL so the main server, apps process, and any one-shot AI tooling can
// open the same db concurrently without blocking.
db.exec("PRAGMA journal_mode = WAL");
export {
  db
};
