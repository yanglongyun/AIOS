import { deleteFinance } from '../service/delete.js';

export const deleteHandler = (body = {}) => {
  return deleteFinance(body);
};
