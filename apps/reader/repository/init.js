import { db } from './client.js';

export const initReaderDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_reader_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '未命名故事',
      premise TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      progress TEXT NOT NULL DEFAULT '第0章',
      chapter_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_reader_chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      idx INTEGER NOT NULL,
      action TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      choices_json TEXT NOT NULL DEFAULT '[]',
      summary TEXT NOT NULL DEFAULT '',
      progress TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(session_id) REFERENCES apps_reader_sessions(id) ON DELETE CASCADE
    )
  `);

  // 预置书籍
  const count = db.prepare('SELECT COUNT(*) as c FROM apps_reader_sessions').get().c;
  if (count === 0) {
    const insertSession = db.prepare(`
      INSERT INTO apps_reader_sessions (title, premise, summary, progress, chapter_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertChapter = db.prepare(`
      INSERT INTO apps_reader_chapters (session_id, idx, action, content, choices_json, summary, progress, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 书1：科幻
    const s1 = insertSession.run(
      '银河便利店', '宇宙尽头有一家24小时便利店，店员是最后一个人类',
      '人类文明消亡后，一个被遗忘的便利店店员独自经营着银河系最后的便利店，接待着形形色色的外星顾客。',
      '第1章', 1, '2026-02-10 20:00:00', '2026-02-10 20:30:00'
    );
    insertChapter.run(s1.lastInsertRowid, 1, '开始营业',
      '叮咚——自动门发出了它一百三十七亿年来始终如一的提示音。\n\n我叫陈落，银河便利店的夜班店员。说是夜班，其实这里没有白天和黑夜，只有永恒的星光透过全景玻璃洒进来。\n\n货架上摆着从各个星系采购来的商品：仙女座的速溶星云咖啡、猎户座的能量棒、还有一种半人马座产的气泡水，打开瓶盖会飘出微型极光。\n\n门又开了。进来一团蓝色的雾气——是泽塔星的常客，它每个周期都来买同一包零食。\n\n"老样子？"我问。\n\n雾气愉快地震动了一下，算是点头。',
      '["给泽塔星人推荐新到的猎户座能量棒","问它最近泽塔星那边怎么样","假装没看见它偷偷拿了两包"]',
      '陈落在银河便利店开始了新的一天，迎来了泽塔星常客。', '第1章', '2026-02-10 20:30:00'
    );

    // 书2：悬疑
    const s2 = insertSession.run(
      '第八节车厢', '一列永远到不了终点站的地铁，第八节车厢里藏着秘密',
      '地铁三号线突然多出了一节不存在的车厢，走进去的乘客会看到自己人生中被遗忘的某一天。',
      '第1章', 1, '2026-02-18 14:00:00', '2026-02-18 14:25:00'
    );
    insertChapter.run(s2.lastInsertRowid, 1, '误入',
      '我注意到这件事纯属偶然。\n\n三号线一共七节车厢，我每天坐倒数第二节，站在同一根柱子旁边，这个习惯保持了三年。但那天早上车门打开时，我数了一下——八节。\n\n多出来的车厢在最末尾，外观没什么不同，只是车窗上有一层淡淡的雾气，像是有人从里面呵了一口气。\n\n我犹豫了大概三秒钟，然后走了进去。\n\n车厢里只有一个乘客，一个穿校服的女生，扎着马尾，正低头写作业。她抬起头看了我一眼。\n\n我愣住了。\n\n那是十七岁的我。',
      '["坐到她对面，看她在写什么","立刻退出车厢","开口问她今天是几号"]',
      '主角在地铁三号线发现了多出的第八节车厢，走进去后看到了十七岁的自己。', '第1章', '2026-02-18 14:25:00'
    );

    // 书3：奇幻
    const s3 = insertSession.run(
      '山海咖啡馆', '上古神兽们退休后在人间开了一家咖啡馆',
      '《山海经》里的神兽们厌倦了神话生活，化为人形在城市里开了一家咖啡馆，用法力做咖啡，用神通解决客人的烦恼。',
      '第1章', 1, '2026-03-01 10:00:00', '2026-03-01 10:20:00'
    );
    insertChapter.run(s3.lastInsertRowid, 1, '新员工',
      '"你就是新来的？"\n\n说话的是一个头发花白的老头，围着咖啡色围裙，正在吧台后面磨豆子。他看起来六十多岁，但眼睛亮得不像话，瞳孔里好像有火焰在跳。\n\n"我叫祝融，"他说，"这里的首席烘焙师。我用真火烘豆子，风味是机器比不了的。"\n\n吧台另一头，一个眉清目秀的年轻女人正在拉花。她手指轻轻一转，杯子里的奶泡自己流动起来，形成了一幅完整的山水画。\n\n"洛神，"祝融介绍道，"她的拉花在整条街都是出了名的。"\n\n洛神头也不抬："上个月有人出一万块想买我一杯拿铁，我没卖。主要是那人长得不行。"\n\n我看了看手里的面试通知：山海咖啡馆，招聘人类实习生一名。\n\n"所以……"我小心翼翼地问，"你们都是《山海经》里的？"',
      '["问还有哪些同事","问为什么要招人类","先尝一杯祝融烘的咖啡"]',
      '主角来到山海咖啡馆面试，认识了祝融和洛神两位神兽同事。', '第1章', '2026-03-01 10:20:00'
    );
  }
};
