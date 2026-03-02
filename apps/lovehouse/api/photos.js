import { db } from '../../app_shared/db/client.js';

export const photosHandler = ({ limit = 50 } = {}) => {
  const safeLimit = Math.min(200, Math.max(1, Number(limit) || 50));
  const items = db.prepare(`
    SELECT id, prompt, url, type, created_at
    FROM apps_lovehouse_photos
    ORDER BY id DESC
    LIMIT ?
  `).all(safeLimit);

  return { items };
};
