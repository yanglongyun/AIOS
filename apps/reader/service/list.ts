import { findAllSessions } from '../repository/list.ts';

export const list = () => {
  const rows = findAllSessions();

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
