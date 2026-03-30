import { createTransaction } from "../repository/create.js";
const createFinance = (body = {}) => {
  const type = String(body.type || "").trim();
  const amount = Number(body.amount);
  const note = String(body.note || "");
  if (!["income", "expense"].includes(type)) {
    return { success: false, message: "type \u5FC5\u987B\u662F income \u6216 expense" };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, message: "amount \u5FC5\u987B\u662F\u5927\u4E8E 0 \u7684\u6570\u5B57" };
  }
  const date = body.date ? String(body.date) : void 0;
  createTransaction({ type, amount, note, date });
  return { success: true };
};
export {
  createFinance
};
