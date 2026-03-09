import { getHistory } from '../service/history.js';

export const historyHandler = (params) => {
  return getHistory(params);
};
