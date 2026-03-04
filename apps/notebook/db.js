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
  `随心记

想到什么就写，不用在意格式。
右侧 ✦ 可以让 AI 帮你润色，置顶把重要的钉在最上面。

你写在这里的东西，AIOS 也能看到。
聊天时它了解你在想什么、关注什么，
给你的回应会更贴合你自己。`,

  `碎片也值得被留下

灵感不会等你准备好。
一个词、半句话、还没想清楚的念头——
先扔进来，不要管它够不够完整。

有时候几周后再看，
才发现当时随手写的那句话，
正好是你现在需要的答案。`,

  `值得慢慢想的事

什么样的一天，结束时不觉得空？
什么事情，是只有自己才能做的？
什么时候，感觉最像自己？

不用现在回答。
写下来，留着。`
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
