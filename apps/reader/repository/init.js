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
      '第三十七次契约',
      '一个活了数百年的人，每次身体衰老就用克隆体替换，已经换了36次。第36次转换时克隆体的意识没有被清除，与本体融合了。',
      '遥远星系的殖民星球"新伊甸"上，寡头伊莱完成了第36次身体更换。但这一次，克隆体诺亚的意识没有被完全抹除，像幽灵一样残留在他的大脑中。随着诺亚的记忆碎片不断闪回，伊莱开始追查一个可怕的真相——他要反抗的暴君，竟然就是他自己。',
      '第1章',
      1,
      '2026-03-20 20:00:00',
      '2026-03-20 20:30:00'
    ],
    chapter: [
      1,
      '醒来',
      '"先生，转换已完成。所有生理指标正常。"\n\n伊莱睁开眼睛。头顶是熟悉的无影灯，空气里弥漫着消毒液和金属的气味。他活动了一下手指——年轻的、有力的手指。每一次醒来都是这种感觉，像是穿上了一件刚从包装里拆出来的新衣服。\n\n"摆渡人，这是第几次了？"他问。\n\n"第三十六次，先生。"AI的声音平静得像在播报天气。\n\n伊莱坐起身，透过全景玻璃俯瞰下方的星球。新伊甸的灯火在夜半球勾勒出城市的轮廓，那些街道、建筑、甚至霓虹灯的色调，都是他按照地球2020年代的样子设计的。\n\n他回到地表的公寓，倒了一杯红酒。酒液刚触碰舌尖，一股奇怪的味道涌了上来——不是红酒，是速溶咖啡。廉价的、加了太多糖的速溶咖啡。\n\n他从没喝过这种东西。\n\n接着，一个画面毫无征兆地闪过：一间狭小的公寓，阳光从百叶窗缝隙里照进来，一个女人背对着他在厨房里哼歌。她转过身，笑着递给他一杯咖啡。\n\n"早安，诺亚。"\n\n伊莱手中的酒杯掉在地上，摔得粉碎。\n\n他不认识这个女人。他的名字也不是诺亚。\n\n但那个笑容，像烙印一样刻进了他的脑海里。',
      '["去医疗中心做一次全面的脑部扫描","试着集中精神，主动回忆更多关于那个女人的画面","联系摆渡人，询问第36号克隆体转换前的详细档案"]',
      '伊莱完成第36次身体更换后，开始出现不属于自己的记忆闪回——一个叫诺亚的人的生活片段。',
      '第1章',
      '2026-03-20 20:30:00'
    ]
  },
  en: {
    session: [
      'The 37th Contract',
      'A man who has lived for centuries by replacing his body with clones discovers that the 36th clone\'s consciousness was never erased.',
      'On the colony world New Eden, oligarch Elias completes his 36th body transfer. But this time, the clone Noah\'s consciousness was not fully wiped — it lingers like a ghost in his mind. As Noah\'s memory fragments keep flashing back, Elias begins to uncover a terrible truth: the tyrant he seeks to overthrow is himself.',
      'Chapter 1',
      1,
      '2026-03-20 20:00:00',
      '2026-03-20 20:30:00'
    ],
    chapter: [
      1,
      'Awakening',
      '"Sir, the transfer is complete. All vitals are normal."\n\nElias opened his eyes. Overhead, the familiar surgical lights. The air carried the scent of antiseptic and metal. He flexed his fingers — young, strong fingers. Every awakening felt the same, like slipping into a suit fresh from the wrapper.\n\n"Charon, which iteration is this?"\n\n"The thirty-sixth, sir." The AI\'s voice was as calm as a weather report.\n\nElias sat up and gazed through the panoramic window at the planet below. New Eden\'s lights traced the outlines of cities across the nightside — streets, buildings, even the neon hues all designed after Earth\'s 2020s, the era he could never let go of.\n\nBack in his penthouse, he poured a glass of red wine. The moment it touched his tongue, a strange taste surged up — not wine, but instant coffee. Cheap, over-sweetened instant coffee.\n\nHe had never drunk anything like it.\n\nThen a scene flashed without warning: a cramped apartment, sunlight streaming through venetian blinds, a woman with her back to him humming in the kitchen. She turned around, smiling, and handed him a mug.\n\n"Good morning, Noah."\n\nThe wine glass slipped from Elias\'s hand and shattered on the floor.\n\nHe did not know this woman. His name was not Noah.\n\nBut that smile was seared into his mind like a brand.',
      '["Go to the medical center for a full brain scan","Try to concentrate and deliberately recall more about the woman","Contact Charon and request the detailed file on Clone No. 36 before the transfer"]',
      'After his 36th body transfer, Elias begins experiencing memory flashbacks that are not his own — fragments from a life lived by someone named Noah.',
      'Chapter 1',
      '2026-03-20 20:30:00'
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
