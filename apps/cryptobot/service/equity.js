import { listEquity as listEquityRepo } from '../repository/equity.js';

export const listEquity = ({ limit = 300 } = {}) => {
  const points = listEquityRepo(limit);
  return { success: true, points };
};
