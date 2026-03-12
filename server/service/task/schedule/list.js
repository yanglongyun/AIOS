import { listTaskSchedules } from '../../../repository/task/schedule.js';

export const listSchedules = ({ limit = 200 } = {}) => {
  return listTaskSchedules(limit);
};
