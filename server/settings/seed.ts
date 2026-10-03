import { createHash } from "node:crypto";
import os from "node:os";
import type { DatabaseSync } from "node:sqlite";

/** 只在全新数据库中写入:「文件」里的第一个入口 —— 用户主目录。 */
export const seedSettings = (db: DatabaseSync) => {
  const home = os.homedir();
  db.prepare("INSERT OR IGNORE INTO file_roots (id, title, path, enabled) VALUES (?, ?, ?, 1)")
    .run(createHash("sha1").update(home).digest("hex").slice(0, 16), "主目录", home);
};
