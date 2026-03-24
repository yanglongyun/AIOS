import type { AnyRecord } from '../../../shared/types.ts';
import { deleteTransactionById } from '../repository/delete.ts';

export const deleteFinance = (body: AnyRecord = {}) => {
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) {
    return { success: false, message: 'id 无效' };
  }
  deleteTransactionById(id);
  return { success: true };
};
