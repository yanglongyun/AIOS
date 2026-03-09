import { getScheduleById } from '../../repository/schedule/detail.js';

export const getScheduleDetail = (id) => {
  return getScheduleById(id);
};
