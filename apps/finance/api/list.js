import { listFinance } from '../service/list.js';

export const listHandler = (query = {}) => {
  return listFinance(query.month);
};
