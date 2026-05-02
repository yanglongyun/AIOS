import { createAppDb } from "../app_shared/db/createAppDb.js";
import { readFileSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const db = createAppDb("demo.db");
const __dirname = dirname(fileURLToPath(import.meta.url));

// Static seed catalogue: which slugs to seed and their metadata.
// HTML body is loaded from ./seeds/<slug>.html so we don't bloat this file.
const SEEDS = [
    { slug: "finance-a", title: "记账本 · 老账本",
      description: "米黄牛皮纸 + 横线纸格 + 楷体 + 印章红和墨水蓝。私人、温暖、慢节奏。",
      file: "a.html" },
    { slug: "finance-b", title: "记账本 · 银行流水单",
      description: "纯黑白等宽字体 + 点状分割线 + 借/贷两栏。冷峻、专业、信息密度高。",
      file: "b.html" },
    { slug: "finance-c", title: "记账本 · 现代理财",
      description: "薄荷绿主调 + 圆环饼图 + 类别 emoji + 圆角卡片。清爽、可视化。",
      file: "c.html" },
    { slug: "finance-d", title: "记账本 · 极简日记",
      description: "暖白纸基底 + 单色辅助 + 单行自然语言录入 + 按日紧凑列表。无饼图、无卡片堆叠，专注录入与看清。",
      file: "d.html" },
];

const initDemoDatabase = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS demos (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            slug        TEXT    NOT NULL UNIQUE,
            title       TEXT    NOT NULL,
            description TEXT    NOT NULL DEFAULT '',
            html        TEXT    NOT NULL,
            created_at  TEXT    DEFAULT (datetime('now')),
            updated_at  TEXT    DEFAULT (datetime('now'))
        );
    `);
    seed();
};

// Insert-only: once a demo row exists, treat it as user data. To re-seed a row,
// delete it manually (e.g. `DELETE FROM demos WHERE slug='finance-a';`).
const seed = () => {
    const insert = db.prepare(`
        INSERT OR IGNORE INTO demos (slug, title, description, html)
        VALUES (@slug, @title, @description, @html)
    `);
    for (const item of SEEDS) {
        const html = readFileSync(join(__dirname, "seeds", item.file), "utf8");
        insert.run({ ...item, html });
    }
};

const rowToMeta = (row) => row && {
    id:          row.id,
    slug:        row.slug,
    title:       row.title,
    description: row.description || "",
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
};

const listDemos = () =>
    db.prepare("SELECT id, slug, title, description, created_at, updated_at FROM demos ORDER BY id ASC")
        .all().map(rowToMeta);

const getDemoBySlug = (slug) =>
    db.prepare("SELECT * FROM demos WHERE slug = ?").get(slug);

export { initDemoDatabase, listDemos, getDemoBySlug };
