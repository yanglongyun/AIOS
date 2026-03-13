import { db } from './client.js';
import { getSystemLanguage } from '../../app_shared/settings/language.js';

const READER_SCHEMA_DEFAULTS_BY_LANGUAGE = {
  zh: {
    title: '未命名故事',
    progress: '第0章'
  },
  en: {
    title: 'Untitled Story',
    progress: 'Chapter 0'
  }
};

const READER_SEED_BY_LANGUAGE = {
  zh: {
    session: [
      '银河便利店',
      '宇宙尽头有一家24小时便利店，店员是最后一个人类',
      '人类文明消亡后，一个被遗忘的便利店店员独自经营着银河系最后的便利店，接待着形形色色的外星顾客。',
      '第1章',
      1,
      '2026-02-10 20:00:00',
      '2026-02-10 20:30:00'
    ],
    chapter: [
      1,
      '开始营业',
      '叮咚——自动门发出了它一百三十七亿年来始终如一的提示音。\n\n我叫陈落，银河便利店的夜班店员。说是夜班，其实这里没有白天和黑夜，只有永恒的星光透过全景玻璃洒进来。\n\n货架上摆着从各个星系采购来的商品：仙女座的速溶星云咖啡、猎户座的能量棒、还有一种半人马座产的气泡水，打开瓶盖会飘出微型极光。\n\n门又开了。进来一团蓝色的雾气——是泽塔星的常客，它每个周期都来买同一包零食。\n\n"老样子？"我问。\n\n雾气愉快地震动了一下，算是点头。',
      '["给泽塔星人推荐新到的猎户座能量棒","问它最近泽塔星那边怎么样","假装没看见它偷偷拿了两包"]',
      '陈落在银河便利店开始了新的一天，迎来了泽塔星常客。',
      '第1章',
      '2026-02-10 20:30:00'
    ]
  },
  en: {
    session: [
      'The Last Station Librarian',
      'A lone librarian guards the final archive at the edge of a frozen world',
      'After the global network collapsed, Mira became the only keeper of the Last Station Library, preserving lost stories for travelers crossing the ice.',
      'Chapter 1',
      1,
      '2026-02-12 09:00:00',
      '2026-02-12 09:30:00'
    ],
    chapter: [
      1,
      'Open the station',
      'The station doors sighed open at dawn, pushing a ribbon of white fog into the reading hall.\n\nMira checked the heat lamps, then walked past shelves labeled with cities that no longer existed. Each spine was a small act of defiance against forgetting.\n\nA traveler stepped in, coat lined with frost and a brass compass hanging from his neck.\n\n"Do you keep maps of the old rail?" he asked.\n\nMira studied his face. People who asked for maps were usually running from something, or toward it.\n\nShe pulled a metal drawer from the archive wall and set three rolled charts on the desk.\n\n"Choose carefully," she said. "Only one of these still tells the truth."',
      '["Ask him why he needs the map now","Show him the oldest chart first","Refuse and ask for his name and destination"]',
      'Mira opens the Last Station Library and meets a traveler searching for a map of the old rail.',
      'Chapter 1',
      '2026-02-12 09:30:00'
    ]
  }
};

export const initReaderDatabase = () => {
  const language = getSystemLanguage();
  const defaults = READER_SCHEMA_DEFAULTS_BY_LANGUAGE[language];
  const seed = READER_SEED_BY_LANGUAGE[language];
  if (!defaults || !seed) {
    throw new Error(`Unsupported system language: ${language}`);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS reader_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '${defaults.title}',
      premise TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      progress TEXT NOT NULL DEFAULT '${defaults.progress}',
      chapter_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS reader_chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      idx INTEGER NOT NULL,
      action TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      choices_json TEXT NOT NULL DEFAULT '[]',
      summary TEXT NOT NULL DEFAULT '',
      progress TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(session_id) REFERENCES reader_sessions(id) ON DELETE CASCADE
    )
  `);

  // 预置书籍
  const count = db.prepare('SELECT COUNT(*) as c FROM reader_sessions').get().c;
  if (count === 0) {
    const insertSession = db.prepare(`
      INSERT INTO reader_sessions (title, premise, summary, progress, chapter_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertChapter = db.prepare(`
      INSERT INTO reader_chapters (session_id, idx, action, content, choices_json, summary, progress, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const s = insertSession.run(...seed.session);
    insertChapter.run(s.lastInsertRowid, ...seed.chapter);
  }
};
