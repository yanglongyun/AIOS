import { db } from '../../app_shared/db/client.js';

export const partiesHandler = (body = {}) => {
  const lang = String(body.lang || 'zh').trim() || 'zh';
  const items = db.prepare(`
    SELECT id, name, candidate_name, policy, logo, support_rate, difficulty, win_count, lang, created_at
    FROM apps_debate_parties
    WHERE lang = ?
    ORDER BY support_rate DESC, id ASC
  `).all(lang);
  return items;
};
