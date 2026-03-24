import type { AnyRecord } from '../../../shared/types.ts';
import { insertSession } from '../repository/create.ts';

export const create = (body: AnyRecord = {}) => {
  const title = String(body.title || '').trim() || '未命名故事';
  const premise = String(body.premise || '').trim();

  const session = insertSession({ title, premise });

  return {
    success: true,
    session: {
      id: session.id,
      title: session.title,
      premise: session.premise,
      summary: session.summary,
      progress: session.progress,
      chapterCount: session.chapter_count,
      createdAt: session.created_at,
      updatedAt: session.updated_at
    }
  };
};
