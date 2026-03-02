import { db } from '../../db.js';

export const getConfigHandler = () => {
  const row = db.prepare('SELECT requirement, updated_at FROM apps_briefing_config WHERE id = 1').get();

  return {
    success: true,
    requirement: row?.requirement || '',
    updatedAt: row?.updated_at || null
  };
};
