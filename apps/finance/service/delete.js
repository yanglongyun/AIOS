import { deleteTransactionById } from "../repository/delete.js";
const deleteFinance = (body = {}) => {
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) {
    return { success: false, message: "id 无效" };
  }
  deleteTransactionById(id);
  return { success: true };
};
export {
  deleteFinance
};
