import { db } from '../../app_shared/db/client.js';

export const messagesHandler = ({ limit = 50 } = {}) => {
  const safeLimit = Math.min(200, Math.max(1, Number(limit) || 50));
  const items = db.prepare(`
    SELECT id, role, content, scene, created_at
    FROM apps_lovehouse_messages
    ORDER BY id ASC
    LIMIT ?
  `).all(safeLimit);

  const sceneSetting = db.prepare(`
    SELECT value FROM apps_lovehouse_settings WHERE key = 'current_scene'
  `).get();

  return {
    items,
    currentScene: sceneSetting?.value || 'sunset'
  };
};
