import { db } from './client.js';

export const getLatestSession = () => {
  return db.prepare(`
    SELECT current_screen, battery_level
    FROM nokia_sessions
    ORDER BY id DESC
    LIMIT 1
  `).get();
};
