import { listTransactions } from '../repository/list.js';

export const listFinance = () => {
  return { success: true, data: listTransactions() };
};
