import { deleteTransactionById } from "../repository/delete.js";
const deleteFinance = (body = {}) => {
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) {
    return { success: false, message: "id \u65E0\u6548" };
  }
  deleteTransactionById(id);
  return { success: true };
};
export {
  deleteFinance
};
