import type { AnyRecord } from '../../../shared/types.ts';
import { deleteNoteById } from '../repository/delete.ts';

export const deleteNotebook = (body: AnyRecord = {}) => {
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) return { error: '缺少 id', status: 400 };
  deleteNoteById(id);
  return { ok: true };
};
