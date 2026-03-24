import { listEquity as listEquityRepo } from '../repository/equity.ts';

export const listEquity = ({ limit = 300 } = {}) => {
  const points = listEquityRepo(limit);
  return { success: true, points };
};
