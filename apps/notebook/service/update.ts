import type { AnyRecord } from '../../../shared/types.ts';
import { updateNoteContent } from '../repository/update.ts';

export const updateNotebook = (body: AnyRecord = {}) => {
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) return { error: '缺少 id', status: 400 };
  updateNoteContent({ id, content: body.content || '' });
  return { ok: true };
};
