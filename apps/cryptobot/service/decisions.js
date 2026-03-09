import { listDecisions as listDecisionsRepo } from '../repository/decisions.js';

export const listDecisions = ({ limit = 50 } = {}) => {
  const items = listDecisionsRepo(limit);
  return { success: true, items };
};
