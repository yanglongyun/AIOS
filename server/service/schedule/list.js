import { listSchedulesByLimit } from '../../repository/schedule/list.js';

export const listSchedules = (limit = 50) => {
  const parsed = Number(limit);
  const safeLimit = Number.isFinite(parsed) ? Math.max(1, Math.min(500, parsed)) : 50;
  return listSchedulesByLimit(safeLimit);
};
