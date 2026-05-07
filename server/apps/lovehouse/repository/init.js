// 虚拟伴侣聊天 — 每条 AI 消息同时带「内心想法」和「公开回复」
import { db } from "./client.js";

const safeAdd = (sql) => { try { db.exec(sql); } catch {} };

export const initLovehouseDatabase = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS apps_lovehouse_messages (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            role        TEXT NOT NULL,
            content     TEXT NOT NULL DEFAULT '',
            thought     TEXT NOT NULL DEFAULT '',
            mood        TEXT NOT NULL DEFAULT '',
            created_at  TEXT DEFAULT (datetime('now'))
        );
    `);
    // 老库平滑升级
    safeAdd("ALTER TABLE apps_lovehouse_messages ADD COLUMN thought TEXT NOT NULL DEFAULT ''");
    safeAdd("ALTER TABLE apps_lovehouse_messages ADD COLUMN mood TEXT NOT NULL DEFAULT ''");
};
