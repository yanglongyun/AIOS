import { db } from "./client.js";
import { getSystemLanguage } from "../../app_shared/settings/language.js";
const DEFAULT_FOCUS_BY_LANGUAGE = {
  zh: "你是一个以自我进化为目标的 AI，每天需要完成自我升级计划：1）搜索今日 AI Agent 领域最重要的新闻和技术突破；2）研究是否有新的框架、模型或工具可以增强自己的能力；3）总结学到的新知识，提出可以应用到 AIOS 系统中的改进建议；4）记录自己的进化日志，对比昨天的自己有哪些成长。目标：每天比昨天更聪明一点。",
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
