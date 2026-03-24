import { listDecisions as listDecisionsRepo } from '../repository/decisions.ts';

export const listDecisions = ({ limit = 50 } = {}) => {
  const items = listDecisionsRepo(limit);
  return { success: true, items };
};
