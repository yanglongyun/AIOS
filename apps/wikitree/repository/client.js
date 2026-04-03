import Database from "better-sqlite3";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbDir = resolve(__dirname, "../../../../appData");
try { mkdirSync(dbDir, { recursive: true }); } catch {}
const db = new Database(resolve(dbDir, "wikitree.db"));

export { db };
