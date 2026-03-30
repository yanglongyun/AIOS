import { db } from "./client.js";
import { getSystemLanguage } from "../../app_shared/settings/language.js";
const NOTEBOOK_SEEDS_BY_LANGUAGE = {
  zh: [
    `\u968F\u5FC3\u8BB0

\u60F3\u5230\u4EC0\u4E48\u5C31\u5199\uFF0C\u4E0D\u7528\u5728\u610F\u683C\u5F0F\u3002
\u53F3\u4FA7 \u2726 \u53EF\u4EE5\u8BA9 AI \u5E2E\u4F60\u6DA6\u8272\uFF0C\u7F6E\u9876\u628A\u91CD\u8981\u7684\u9489\u5728\u6700\u4E0A\u9762\u3002

\u4F60\u5199\u5728\u8FD9\u91CC\u7684\u4E1C\u897F\uFF0CAIOS \u4E5F\u80FD\u770B\u5230\u3002
\u804A\u5929\u65F6\u5B83\u4E86\u89E3\u4F60\u5728\u60F3\u4EC0\u4E48\u3001\u5173\u6CE8\u4EC0\u4E48\uFF0C
\u7ED9\u4F60\u7684\u56DE\u5E94\u4F1A\u66F4\u8D34\u5408\u4F60\u81EA\u5DF1\u3002`,
    `\u788E\u7247\u4E5F\u503C\u5F97\u88AB\u7559\u4E0B

\u7075\u611F\u4E0D\u4F1A\u7B49\u4F60\u51C6\u5907\u597D\u3002
\u4E00\u4E2A\u8BCD\u3001\u534A\u53E5\u8BDD\u3001\u8FD8\u6CA1\u60F3\u6E05\u695A\u7684\u5FF5\u5934\u2014\u2014
\u5148\u6254\u8FDB\u6765\uFF0C\u4E0D\u8981\u7BA1\u5B83\u591F\u4E0D\u591F\u5B8C\u6574\u3002

\u6709\u65F6\u5019\u51E0\u5468\u540E\u518D\u770B\uFF0C
\u624D\u53D1\u73B0\u5F53\u65F6\u968F\u624B\u5199\u7684\u90A3\u53E5\u8BDD\uFF0C
\u6B63\u597D\u662F\u4F60\u73B0\u5728\u9700\u8981\u7684\u7B54\u6848\u3002`,
    `\u503C\u5F97\u6162\u6162\u60F3\u7684\u4E8B

\u4EC0\u4E48\u6837\u7684\u4E00\u5929\uFF0C\u7ED3\u675F\u65F6\u4E0D\u89C9\u5F97\u7A7A\uFF1F
\u4EC0\u4E48\u4E8B\u60C5\uFF0C\u662F\u53EA\u6709\u81EA\u5DF1\u624D\u80FD\u505A\u7684\uFF1F
\u4EC0\u4E48\u65F6\u5019\uFF0C\u611F\u89C9\u6700\u50CF\u81EA\u5DF1\uFF1F

\u4E0D\u7528\u73B0\u5728\u56DE\u7B54\u3002
\u5199\u4E0B\u6765\uFF0C\u7559\u7740\u3002`
  ],
  en: [
    `Free Notes

Write whatever comes to mind. Format can wait.
Use the \u2726 button to polish with AI, and pin what matters most.

Everything here is visible to AIOS too.
When you chat, it can better understand what you care about
and give responses that fit you better.`,
    `Fragments Matter

Ideas do not wait for perfect timing.
A single word, half a sentence, an unfinished thought \u2014
drop it here first, and keep moving.

Weeks later, you may realize
the line you wrote casually
was exactly what you needed now.`,
    `Questions Worth Keeping

What kind of day feels full when it ends?
What work can only you do?
When do you feel most like yourself?

You do not need answers now.
Write them down and keep them.`
  ]
};
const initNotebookTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL DEFAULT '',
      style INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
};
const seedNotebookIfEmpty = () => {
  const count = db.prepare("SELECT COUNT(*) as c FROM notes").get().c;
  if (count !== 0) return;
  const language = getSystemLanguage();
  const seeds = NOTEBOOK_SEEDS_BY_LANGUAGE[language];
  if (!seeds) {
    throw new Error(`Unsupported system language: ${language}`);
  }
  const insert = db.prepare(`
    INSERT INTO notes (content, style, created_at, updated_at)
    VALUES (?, ?, datetime('now'), datetime('now'))
  `);
  for (const content of seeds) {
    insert.run(content, Math.floor(Math.random() * 8));
  }
};
const initNotebookDatabase = () => {
  initNotebookTables();
  seedNotebookIfEmpty();
};
export {
  initNotebookDatabase
};
