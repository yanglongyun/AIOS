import { db } from '../db.js';

export const listHandler = () => {
  const rows = db.prepare(`
    SELECT id, title, summary, progress, chapter_count, updated_at, created_at
    FROM apps_story_sessions
    ORDER BY id DESC
  `).all();

  return {
    success: true,
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      summary: r.summary || '',
      progress: r.progress || '',
      chapterCount: r.chapter_count || 0,
      updatedAt: r.updated_at,
      createdAt: r.created_at
    }))
  };
};
