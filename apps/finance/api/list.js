import { listFinance } from '../service/list.js';

export const listHandler = () => {
  return listFinance();
};
