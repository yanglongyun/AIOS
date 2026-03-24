import type { AnyRecord } from '../../../shared/types.ts';
import { createNote } from '../repository/create.ts';

export const createNotebook = async (body: AnyRecord = {}) => {
  const content = String(body.content || '');
  const style = body.style != null ? Number(body.style) : Math.floor(Math.random() * 12);
  const id = createNote({ content, style });
  return { id };
};
