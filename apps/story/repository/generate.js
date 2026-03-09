import { db } from './client.js';

export const findSessionById = (sessionId) => {
  return db.prepare('SELECT id FROM apps_story_sessions WHERE id = ?').get(sessionId);
};

export const countChapters = (sessionId) => {
  const { c } = db.prepare(
    'SELECT COUNT(*) as c FROM apps_story_chapters WHERE session_id = ?'
  ).get(sessionId);
  return c || 0;
};

export const insertChapter = ({ sessionId, idx, action, content, choicesJson, summary, progress }) => {
  db.prepare(`
    INSERT INTO apps_story_chapters (session_id, idx, action, content, choices_json, summary, progress, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(sessionId, idx, action, content, choicesJson, summary, progress);
};

export const updateSessionProgress = ({ sessionId, summary, progress, chapterCount }) => {
  db.prepare(`
    UPDATE apps_story_sessions
    SET summary = ?, progress = ?, chapter_count = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(summary, progress, chapterCount, sessionId);
};
