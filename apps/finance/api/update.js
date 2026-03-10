import { updateFinance } from '../service/update.js';

export const updateHandler = (body = {}) => {
  return updateFinance(body);
};
