import { ensureTodayAndGet } from '../service/today.js';

export const todayHandler = async () => {
  return ensureTodayAndGet();
};
