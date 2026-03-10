import { getToday } from '../service/today.js';

export const todayHandler = () => {
  return getToday();
};
