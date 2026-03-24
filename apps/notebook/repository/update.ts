import type { AnyRecord } from '../../../shared/types.ts';
import { db } from './client.ts';

export const updateNoteContent = ({ id, content = '' }: AnyRecord = {}) => {
  db.prepare("UPDATE notes SET content = ?, updated_at = datetime('now') WHERE id = ?").run(content, id);
};
