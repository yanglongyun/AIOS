import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { db } from '../app_shared/db/client.js';
import { todayHandler } from './api/today.js';
import { answerHandler } from './api/answer.js';
import { historyHandler } from './api/history.js';
import { ensureTodayQuestion } from './api/generate-question.js';

export const initLifeguideDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_lifeguide_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      question TEXT NOT NULL,
      purpose TEXT DEFAULT '',
      tags_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_lifeguide_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL UNIQUE,
      answer TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(question_id) REFERENCES apps_lifeguide_questions(id) ON DELETE CASCADE
    )
  `);
};

export const handleLifeguideApi = async (req, res, path) => {
  if (path === '/api/apps/lifeguide/today' && req.method === 'GET') {
    const data = await todayHandler();
    return json(res, data);
  }

  if (path === '/api/apps/lifeguide/answer' && req.method === 'POST') {
    const body = await readBody(req);
    const data = answerHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/lifeguide/history' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 10);
    const data = historyHandler({ page, pageSize });
    return json(res, data);
  }

  if (path === '/api/apps/lifeguide/refresh' && req.method === 'POST') {
    // 手动刷新：仅当今天还没生成时会创建，不覆盖当天已有问题。
    const q = await ensureTodayQuestion();
    return json(res, { success: true, id: q.id });
  }

  return false;
};
