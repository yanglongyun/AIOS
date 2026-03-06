import { db } from '../../db.js';

export const getProfileHandler = () => {
  const row = db.prepare(`
    SELECT display_name AS displayName, signature, avatar_url AS avatarUrl, updated_at AS updatedAt
    FROM weibo_profile
    WHERE id = 1
  `).get();
  return {
    success: true,
    profile: {
      displayName: String(row?.displayName || 'twitter'),
      signature: String(row?.signature || ''),
      avatarUrl: String(row?.avatarUrl || ''),
      updatedAt: row?.updatedAt || null
    }
  };
};
