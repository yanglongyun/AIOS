import { readBody } from '../../utils/readBody.js';
import { json } from '../../utils/json.js';
import { db } from '../../db/client.js';
import { partiesHandler } from './api/parties.js';
import { startHandler } from './api/start.js';
import { debateHandler } from './api/debate.js';
import { optimizeHandler } from './api/optimize.js';
import { summaryHandler } from './api/summary.js';
import { continueHandler } from './api/continue.js';
import { finishHandler } from './api/finish.js';
import { saveHandler } from './api/save.js';

const DEFAULT_PARTIES = [
  {
    name: '共和党',
    candidate_name: '特朗普',
    policy: '减税、强硬移民政策、美国优先、传统价值观、放松监管',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Republicanlogo.svg/200px-Republicanlogo.svg.png',
    support_rate: 45,
    difficulty: '中等',
    win_count: 0,
    lang: 'zh'
  },
  {
    name: '民主党',
    candidate_name: '拜登',
    policy: '加税富人、环保政策、多元化、扩大政府项目、国际合作',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/DemocraticParty.svg/200px-DemocraticParty.svg.png',
    support_rate: 47,
    difficulty: '中等',
    win_count: 0,
    lang: 'zh'
  },
  {
    name: '绿党',
    candidate_name: '斯坦因',
    policy: '环境保护、可再生能源、社会正义、反战、草根民主',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Green_Party_of_the_United_States_logo.svg/200px-Green_Party_of_the_United_States_logo.svg.png',
    support_rate: 3,
    difficulty: '困难',
    win_count: 0,
    lang: 'zh'
  },
  {
    name: '自由党',
    candidate_name: '约翰逊',
    policy: '小政府、个人自由、自由市场、非干预主义外交政策',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Libertarian_Party_%28US%29_logo.svg/200px-Libertarian_Party_%28US%29_logo.svg.png',
    support_rate: 2,
    difficulty: '困难',
    win_count: 0,
    lang: 'zh'
  },
  {
    name: '独立候选人',
    candidate_name: '肯尼迪',
    policy: '政治改革、反腐败、中间路线、政府透明化',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_the_United_States.svg/200px-Flag_of_the_United_States.svg.png',
    support_rate: 3,
    difficulty: '困难',
    win_count: 0,
    lang: 'zh'
  }
];

export const initDebateDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_debate_parties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      candidate_name TEXT NOT NULL,
      policy TEXT NOT NULL,
      logo TEXT,
      support_rate INTEGER NOT NULL,
      difficulty TEXT NOT NULL,
      win_count INTEGER DEFAULT 0,
      lang TEXT DEFAULT 'zh',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_debate_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      debate_id TEXT UNIQUE NOT NULL,
      candidate_name TEXT NOT NULL,
      candidate_party TEXT NOT NULL,
      opponent_name TEXT NOT NULL,
      opponent_party TEXT NOT NULL,
      candidate_support_rate INTEGER,
      opponent_support_rate INTEGER,
      start_time TEXT DEFAULT (datetime('now')),
      end_time TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_debate_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      debate_id TEXT NOT NULL,
      topic_name TEXT NOT NULL,
      speaker_role TEXT NOT NULL,
      speaker_name TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      draft TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const count = db.prepare('SELECT COUNT(*) AS c FROM apps_debate_parties').get().c;
  if (!count) {
    const stmt = db.prepare(`
      INSERT INTO apps_debate_parties (
        name, candidate_name, policy, logo, support_rate, difficulty, win_count, lang
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const tx = db.transaction(() => {
      for (const p of DEFAULT_PARTIES) {
        stmt.run(p.name, p.candidate_name, p.policy, p.logo, p.support_rate, p.difficulty, p.win_count, p.lang);
      }
    });
    tx();
  }
};

export const handleDebateApi = async (req, res, path) => {
  if (path === '/api/apps/debate/parties' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, partiesHandler(body));
  }

  if (path === '/api/apps/debate/start' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await startHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/debate/debate' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await debateHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/debate/optimize' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await optimizeHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/debate/summary' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await summaryHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/debate/continue' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await continueHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/debate/finish' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await finishHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/debate/save' && req.method === 'POST') {
    const body = await readBody(req);
    const data = saveHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
