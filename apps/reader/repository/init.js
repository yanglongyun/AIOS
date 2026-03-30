import { db } from "./client.js";
import { getSystemLanguage } from "../../app_shared/settings/language.js";
const READER_SCHEMA_DEFAULTS_BY_LANGUAGE = {
  zh: {
    title: "\u672A\u547D\u540D\u6545\u4E8B",
    progress: "\u7B2C0\u7AE0"
  },
  en: {
    title: "Untitled Story",
    progress: "Chapter 0"
  }
};
const READER_SEED_BY_LANGUAGE = {
  zh: {
    session: [
      "\u7B2C\u4E09\u5341\u4E03\u6B21\u5951\u7EA6",
      "\u4E00\u4E2A\u6D3B\u4E86\u6570\u767E\u5E74\u7684\u4EBA\uFF0C\u6BCF\u6B21\u8EAB\u4F53\u8870\u8001\u5C31\u7528\u514B\u9686\u4F53\u66FF\u6362\uFF0C\u5DF2\u7ECF\u6362\u4E8636\u6B21\u3002\u7B2C36\u6B21\u8F6C\u6362\u65F6\u514B\u9686\u4F53\u7684\u610F\u8BC6\u6CA1\u6709\u88AB\u6E05\u9664\uFF0C\u4E0E\u672C\u4F53\u878D\u5408\u4E86\u3002",
      '\u9065\u8FDC\u661F\u7CFB\u7684\u6B96\u6C11\u661F\u7403"\u65B0\u4F0A\u7538"\u4E0A\uFF0C\u5BE1\u5934\u4F0A\u83B1\u5B8C\u6210\u4E86\u7B2C36\u6B21\u8EAB\u4F53\u66F4\u6362\u3002\u4F46\u8FD9\u4E00\u6B21\uFF0C\u514B\u9686\u4F53\u8BFA\u4E9A\u7684\u610F\u8BC6\u6CA1\u6709\u88AB\u5B8C\u5168\u62B9\u9664\uFF0C\u50CF\u5E7D\u7075\u4E00\u6837\u6B8B\u7559\u5728\u4ED6\u7684\u5927\u8111\u4E2D\u3002\u968F\u7740\u8BFA\u4E9A\u7684\u8BB0\u5FC6\u788E\u7247\u4E0D\u65AD\u95EA\u56DE\uFF0C\u4F0A\u83B1\u5F00\u59CB\u8FFD\u67E5\u4E00\u4E2A\u53EF\u6015\u7684\u771F\u76F8\u2014\u2014\u4ED6\u8981\u53CD\u6297\u7684\u66B4\u541B\uFF0C\u7ADF\u7136\u5C31\u662F\u4ED6\u81EA\u5DF1\u3002',
      "\u7B2C1\u7AE0",
      1,
      "2026-03-20 20:00:00",
      "2026-03-20 20:30:00"
    ],
    chapter: [
      1,
      "\u9192\u6765",
      '"\u5148\u751F\uFF0C\u8F6C\u6362\u5DF2\u5B8C\u6210\u3002\u6240\u6709\u751F\u7406\u6307\u6807\u6B63\u5E38\u3002"\n\n\u4F0A\u83B1\u7741\u5F00\u773C\u775B\u3002\u5934\u9876\u662F\u719F\u6089\u7684\u65E0\u5F71\u706F\uFF0C\u7A7A\u6C14\u91CC\u5F25\u6F2B\u7740\u6D88\u6BD2\u6DB2\u548C\u91D1\u5C5E\u7684\u6C14\u5473\u3002\u4ED6\u6D3B\u52A8\u4E86\u4E00\u4E0B\u624B\u6307\u2014\u2014\u5E74\u8F7B\u7684\u3001\u6709\u529B\u7684\u624B\u6307\u3002\u6BCF\u4E00\u6B21\u9192\u6765\u90FD\u662F\u8FD9\u79CD\u611F\u89C9\uFF0C\u50CF\u662F\u7A7F\u4E0A\u4E86\u4E00\u4EF6\u521A\u4ECE\u5305\u88C5\u91CC\u62C6\u51FA\u6765\u7684\u65B0\u8863\u670D\u3002\n\n"\u6446\u6E21\u4EBA\uFF0C\u8FD9\u662F\u7B2C\u51E0\u6B21\u4E86\uFF1F"\u4ED6\u95EE\u3002\n\n"\u7B2C\u4E09\u5341\u516D\u6B21\uFF0C\u5148\u751F\u3002"AI\u7684\u58F0\u97F3\u5E73\u9759\u5F97\u50CF\u5728\u64AD\u62A5\u5929\u6C14\u3002\n\n\u4F0A\u83B1\u5750\u8D77\u8EAB\uFF0C\u900F\u8FC7\u5168\u666F\u73BB\u7483\u4FEF\u77B0\u4E0B\u65B9\u7684\u661F\u7403\u3002\u65B0\u4F0A\u7538\u7684\u706F\u706B\u5728\u591C\u534A\u7403\u52FE\u52D2\u51FA\u57CE\u5E02\u7684\u8F6E\u5ED3\uFF0C\u90A3\u4E9B\u8857\u9053\u3001\u5EFA\u7B51\u3001\u751A\u81F3\u9713\u8679\u706F\u7684\u8272\u8C03\uFF0C\u90FD\u662F\u4ED6\u6309\u7167\u5730\u74032020\u5E74\u4EE3\u7684\u6837\u5B50\u8BBE\u8BA1\u7684\u3002\n\n\u4ED6\u56DE\u5230\u5730\u8868\u7684\u516C\u5BD3\uFF0C\u5012\u4E86\u4E00\u676F\u7EA2\u9152\u3002\u9152\u6DB2\u521A\u89E6\u78B0\u820C\u5C16\uFF0C\u4E00\u80A1\u5947\u602A\u7684\u5473\u9053\u6D8C\u4E86\u4E0A\u6765\u2014\u2014\u4E0D\u662F\u7EA2\u9152\uFF0C\u662F\u901F\u6EB6\u5496\u5561\u3002\u5EC9\u4EF7\u7684\u3001\u52A0\u4E86\u592A\u591A\u7CD6\u7684\u901F\u6EB6\u5496\u5561\u3002\n\n\u4ED6\u4ECE\u6CA1\u559D\u8FC7\u8FD9\u79CD\u4E1C\u897F\u3002\n\n\u63A5\u7740\uFF0C\u4E00\u4E2A\u753B\u9762\u6BEB\u65E0\u5F81\u5146\u5730\u95EA\u8FC7\uFF1A\u4E00\u95F4\u72ED\u5C0F\u7684\u516C\u5BD3\uFF0C\u9633\u5149\u4ECE\u767E\u53F6\u7A97\u7F1D\u9699\u91CC\u7167\u8FDB\u6765\uFF0C\u4E00\u4E2A\u5973\u4EBA\u80CC\u5BF9\u7740\u4ED6\u5728\u53A8\u623F\u91CC\u54FC\u6B4C\u3002\u5979\u8F6C\u8FC7\u8EAB\uFF0C\u7B11\u7740\u9012\u7ED9\u4ED6\u4E00\u676F\u5496\u5561\u3002\n\n"\u65E9\u5B89\uFF0C\u8BFA\u4E9A\u3002"\n\n\u4F0A\u83B1\u624B\u4E2D\u7684\u9152\u676F\u6389\u5728\u5730\u4E0A\uFF0C\u6454\u5F97\u7C89\u788E\u3002\n\n\u4ED6\u4E0D\u8BA4\u8BC6\u8FD9\u4E2A\u5973\u4EBA\u3002\u4ED6\u7684\u540D\u5B57\u4E5F\u4E0D\u662F\u8BFA\u4E9A\u3002\n\n\u4F46\u90A3\u4E2A\u7B11\u5BB9\uFF0C\u50CF\u70D9\u5370\u4E00\u6837\u523B\u8FDB\u4E86\u4ED6\u7684\u8111\u6D77\u91CC\u3002',
      '["\u53BB\u533B\u7597\u4E2D\u5FC3\u505A\u4E00\u6B21\u5168\u9762\u7684\u8111\u90E8\u626B\u63CF","\u8BD5\u7740\u96C6\u4E2D\u7CBE\u795E\uFF0C\u4E3B\u52A8\u56DE\u5FC6\u66F4\u591A\u5173\u4E8E\u90A3\u4E2A\u5973\u4EBA\u7684\u753B\u9762","\u8054\u7CFB\u6446\u6E21\u4EBA\uFF0C\u8BE2\u95EE\u7B2C36\u53F7\u514B\u9686\u4F53\u8F6C\u6362\u524D\u7684\u8BE6\u7EC6\u6863\u6848"]',
      "\u4F0A\u83B1\u5B8C\u6210\u7B2C36\u6B21\u8EAB\u4F53\u66F4\u6362\u540E\uFF0C\u5F00\u59CB\u51FA\u73B0\u4E0D\u5C5E\u4E8E\u81EA\u5DF1\u7684\u8BB0\u5FC6\u95EA\u56DE\u2014\u2014\u4E00\u4E2A\u53EB\u8BFA\u4E9A\u7684\u4EBA\u7684\u751F\u6D3B\u7247\u6BB5\u3002",
      "\u7B2C1\u7AE0",
      "2026-03-20 20:30:00"
    ]
  },
  en: {
    session: [
      "The 37th Contract",
      "A man who has lived for centuries by replacing his body with clones discovers that the 36th clone's consciousness was never erased.",
      "On the colony world New Eden, oligarch Elias completes his 36th body transfer. But this time, the clone Noah's consciousness was not fully wiped \u2014 it lingers like a ghost in his mind. As Noah's memory fragments keep flashing back, Elias begins to uncover a terrible truth: the tyrant he seeks to overthrow is himself.",
      "Chapter 1",
      1,
      "2026-03-20 20:00:00",
      "2026-03-20 20:30:00"
    ],
    chapter: [
      1,
      "Awakening",
      `"Sir, the transfer is complete. All vitals are normal."

Elias opened his eyes. Overhead, the familiar surgical lights. The air carried the scent of antiseptic and metal. He flexed his fingers \u2014 young, strong fingers. Every awakening felt the same, like slipping into a suit fresh from the wrapper.

"Charon, which iteration is this?"

"The thirty-sixth, sir." The AI's voice was as calm as a weather report.

Elias sat up and gazed through the panoramic window at the planet below. New Eden's lights traced the outlines of cities across the nightside \u2014 streets, buildings, even the neon hues all designed after Earth's 2020s, the era he could never let go of.

Back in his penthouse, he poured a glass of red wine. The moment it touched his tongue, a strange taste surged up \u2014 not wine, but instant coffee. Cheap, over-sweetened instant coffee.

He had never drunk anything like it.

Then a scene flashed without warning: a cramped apartment, sunlight streaming through venetian blinds, a woman with her back to him humming in the kitchen. She turned around, smiling, and handed him a mug.

"Good morning, Noah."

The wine glass slipped from Elias's hand and shattered on the floor.

He did not know this woman. His name was not Noah.

But that smile was seared into his mind like a brand.`,
      '["Go to the medical center for a full brain scan","Try to concentrate and deliberately recall more about the woman","Contact Charon and request the detailed file on Clone No. 36 before the transfer"]',
      "After his 36th body transfer, Elias begins experiencing memory flashbacks that are not his own \u2014 fragments from a life lived by someone named Noah.",
      "Chapter 1",
      "2026-03-20 20:30:00"
    ]
  }
};
const initReaderDatabase = () => {
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
  const count = db.prepare("SELECT COUNT(*) as c FROM reader_sessions").get().c;
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
export {
  initReaderDatabase
};
