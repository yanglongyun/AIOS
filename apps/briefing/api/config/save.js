import { db } from '../../db.js';

export const saveConfigHandler = (body = {}) => {
  const requirement = String(body.requirement || '').trim();

  db.prepare(`
    INSERT INTO apps_briefing_config (id, requirement, updated_at)
    VALUES (1, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      requirement = excluded.requirement,
      updated_at = datetime('now')
  `).run(requirement);

  return {
    success: true,
    requirement,
    updatedAt: new Date().toISOString()
  };
};
