import { updateResourceById } from '../../repository/resources/update.js';

export const updateResource = ({ id, title, content }) => {
  if (!id) throw new Error('id is required');
  const t = String(title || '').trim();
  if (!t) throw new Error('title is required');
  const c = String(content || '').trim();
  updateResourceById(id, t, c);
};
