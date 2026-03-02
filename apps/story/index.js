import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { db } from '../app_shared/db/client.js';
import { createHandler } from './api/create.js';
import { listHandler } from './api/list.js';
import { historyHandler } from './api/history.js';
import { generateHandler } from './api/generate.js';
import { resetHandler } from './api/reset.js';

export const initStoryDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_story_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '未命名故事',
      story_prompt TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      progress TEXT NOT NULL DEFAULT '第0章',
      total_chapters INTEGER NOT NULL DEFAULT 0,
      last_user_input TEXT NOT NULL DEFAULT '',
      last_chapter_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_story_turns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      turn_index INTEGER NOT NULL,
      role TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      choices_json TEXT NOT NULL DEFAULT '[]',
      summary TEXT NOT NULL DEFAULT '',
      progress TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(session_id) REFERENCES apps_story_sessions(id) ON DELETE CASCADE
    )
  `);
};

export const handleStoryApi = async (req, res, path) => {
  if (path === '/api/apps/story/list' && req.method === 'GET') {
    return json(res, listHandler());
  }

  if (path === '/api/apps/story/create' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, createHandler(body));
  }

  if (path === '/api/apps/story/history' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = Number(url.searchParams.get('sessionId') || 0);
    const data = historyHandler({ sessionId });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/story/generate' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await generateHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/story/reset' && req.method === 'POST') {
    const body = await readBody(req);
    const data = resetHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
