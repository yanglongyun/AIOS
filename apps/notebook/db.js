import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const dir = join(root, 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, 'notebook.db'));
db.pragma('journal_mode = WAL');

const SEED_NOTES = [
  `随心记 · 使用指南

想到什么就写什么，不用在意格式。
支持 AI 优化（右侧 ✦ 按钮），帮你整理措辞。
置顶功能可以把重要的笔记钉在最上面。`,

  `今天的一些想法

有时候脑子里转的东西，不写下来就消失了。
这里就是用来接住那些念头的地方——
不重要的随手丢，重要的留着慢慢看。`,

  `备忘：值得反复想的问题

什么事情做完之后会让我觉得这一天没白过？
慢下来，比想象中更难，也比想象中更值得。`
];

export const initNotebookDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL DEFAULT '',
      pinned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const count = db.prepare('SELECT COUNT(*) as c FROM apps_notes').get().c;
  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO apps_notes (content, pinned, created_at, updated_at)
      VALUES (?, 0, datetime('now'), datetime('now'))
    `);
    for (const content of SEED_NOTES) {
      insert.run(content);
    }
  }
};
