import { insertResource } from '../../repository/resources/create.js';

export const createResource = ({ title, content }) => {
  const t = String(title || '').trim();
  if (!t) throw new Error('title is required');
  const c = String(content || '').trim();
  return { id: insertResource(t, c) };
};
