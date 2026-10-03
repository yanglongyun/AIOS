import { createHash, randomUUID } from "node:crypto";
import os from "node:os";
import type { DatabaseSync } from "node:sqlite";
import { DEFAULT_RULES } from "./defaults.js";

/** 只在全新数据库中写入:默认规则,以及「文件」里的第一个入口 —— 用户主目录。 */
export const seedSettings = (db: DatabaseSync) => {
  const write = db.prepare("INSERT INTO settings_rules (id, text, enabled, position) VALUES (?, ?, 1, ?)");
  DEFAULT_RULES.forEach((text, index) => write.run(randomUUID(), text, index));
  const home = os.homedir();
  db.prepare("INSERT OR IGNORE INTO file_roots (id, title, path, enabled) VALUES (?, ?, ?, 1)")
    .run(createHash("sha1").update(home).digest("hex").slice(0, 16), "主目录", home);
};
