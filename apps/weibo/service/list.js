import { findPosts } from '../repository/list.js';

export const list = ({ limit = 50 } = {}) => {
  const n = Math.max(1, Math.min(200, Number(limit) || 50));
  const data = findPosts(n);
  return { success: true, data };
};
