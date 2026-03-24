import { listTaskSchedules } from '../../repository/task/schedule.ts';

export const listSchedules = ({ limit = 200 } = {}) => {
  return listTaskSchedules(limit);
};
