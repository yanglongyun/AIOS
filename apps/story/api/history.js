import { history } from '../service/history.js';

export const historyHandler = (params = {}) => {
  return history(params);
};
