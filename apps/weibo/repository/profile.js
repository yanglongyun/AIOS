import { db } from './client.js';

export const getProfile = () => {
  return db.prepare(`
    SELECT display_name AS displayName, signature, avatar_url AS avatarUrl, updated_at AS updatedAt
    FROM weibo_profile
    WHERE id = 1
  `).get();
};

export const updateProfile = ({ displayName, signature, avatarUrl }) => {
  db.prepare(`
    UPDATE weibo_profile
    SET display_name = ?, signature = ?, avatar_url = ?, updated_at = datetime('now')
    WHERE id = 1
  `).run(displayName, signature, avatarUrl);

  return db.prepare(`
    SELECT display_name AS displayName, signature, avatar_url AS avatarUrl, updated_at AS updatedAt
    FROM weibo_profile
    WHERE id = 1
  `).get();
};
