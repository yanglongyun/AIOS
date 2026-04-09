import { db } from "./client.js";
import { getSystemLanguage } from "../../app_shared/settings/language.js";

const SEED = {
  zh: [
    { name: "少 数 派", url: "https://sspai.com/feed" },
    { name: "机 核", url: "https://www.gcores.com/rss" },
{ name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
    { name: "Wired", url: "https://www.wired.com/feed/rss" }
  ],
  en: [
    { name: "TechCrunch", url: "https://techcrunch.com/feed/" },
    { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
    { name: "Wired", url: "https://www.wired.com/feed/rss" },
    { name: "Smashing Magazine", url: "https://www.smashingmagazine.com/feed" },
    { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index" }
  ]
};

const initRssreaderDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rss_feeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS rss_bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feed_id INTEGER,
      title TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  const count = db.prepare("SELECT COUNT(*) as c FROM rss_feeds").get().c;
  if (count === 0) {
    const lang = getSystemLanguage();
    const seeds = SEED[lang] || SEED.en;
    const insert = db.prepare("INSERT INTO rss_feeds (name, url) VALUES (?, ?)");
    for (const s of seeds) insert.run(s.name, s.url);
  }
};

export { initRssreaderDatabase };
