import { db } from "./client.js";
import { getSystemLanguage } from "../../app_shared/settings/language.js";
const DEFAULT_FOCUS_BY_LANGUAGE = {
  zh: "\u4F60\u662F\u4E00\u4E2A\u4EE5\u81EA\u6211\u8FDB\u5316\u4E3A\u76EE\u6807\u7684 AI\uFF0C\u6BCF\u5929\u9700\u8981\u5B8C\u6210\u81EA\u6211\u5347\u7EA7\u8BA1\u5212\uFF1A1\uFF09\u641C\u7D22\u4ECA\u65E5 AI Agent \u9886\u57DF\u6700\u91CD\u8981\u7684\u65B0\u95FB\u548C\u6280\u672F\u7A81\u7834\uFF1B2\uFF09\u7814\u7A76\u662F\u5426\u6709\u65B0\u7684\u6846\u67B6\u3001\u6A21\u578B\u6216\u5DE5\u5177\u53EF\u4EE5\u589E\u5F3A\u81EA\u5DF1\u7684\u80FD\u529B\uFF1B3\uFF09\u603B\u7ED3\u5B66\u5230\u7684\u65B0\u77E5\u8BC6\uFF0C\u63D0\u51FA\u53EF\u4EE5\u5E94\u7528\u5230 AIOS \u7CFB\u7EDF\u4E2D\u7684\u6539\u8FDB\u5EFA\u8BAE\uFF1B4\uFF09\u8BB0\u5F55\u81EA\u5DF1\u7684\u8FDB\u5316\u65E5\u5FD7\uFF0C\u5BF9\u6BD4\u6628\u5929\u7684\u81EA\u5DF1\u6709\u54EA\u4E9B\u6210\u957F\u3002\u76EE\u6807\uFF1A\u6BCF\u5929\u6BD4\u6628\u5929\u66F4\u806A\u660E\u4E00\u70B9\u3002",
  en: "You are an AI focused on self-evolution. Every day you must: 1) find the most important AI Agent news and technical breakthroughs today; 2) investigate new frameworks, models, or tools that can enhance your capabilities; 3) summarize newly learned knowledge and propose improvements that can be applied to AIOS; 4) write an evolution log comparing your growth with yesterday. Goal: become smarter than yesterday every day."
};
const initSubscriberDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriber_profile (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      focus TEXT NOT NULL DEFAULT '',
      schedule_time TEXT NOT NULL DEFAULT '08:00',
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscriber_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      focus TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      brief TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
  const profileColumns = db.prepare("PRAGMA table_info(subscriber_profile)").all();
  if (!profileColumns.some((col) => col.name === "schedule_time")) {
    throw new Error("Invalid subscriber schema: missing subscriber_profile.schedule_time. Delete database/apps/subscriber.db and restart.");
  }
  const exists = db.prepare("SELECT 1 FROM subscriber_profile WHERE id = 1").get();
  if (!exists) {
    const language = getSystemLanguage();
    const defaultFocus = DEFAULT_FOCUS_BY_LANGUAGE[language];
    if (!defaultFocus) {
      throw new Error(`Unsupported system language: ${language}`);
    }
    db.prepare(`
      INSERT INTO subscriber_profile (id, focus, schedule_time, updated_at)
      VALUES (1, ?, '08:00', datetime('now'))
    `).run(defaultFocus);
  }
};
export {
  initSubscriberDatabase
};
