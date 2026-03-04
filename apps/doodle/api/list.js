import { db } from '../db.js';

export const listHandler = () => {
  const items = db.prepare(`
    SELECT id, original_path AS originalPath, prompt, region, created_at AS createdAt
    FROM apps_doodle_works ORDER BY id DESC LIMIT 50
  `).all();
  return { success: true, items };
};
