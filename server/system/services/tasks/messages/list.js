// @ts-nocheck
import { listMessages } from "../../../repository/chat/messages/index.js";

const listTaskMessages = ({ taskId, limit = 200, offset = 0, order = "asc", recent = false } = {}) => {
  const id = String(taskId || "").trim();
  if (!id) throw new Error("taskId is required");
  return listMessages({ chatId: id, limit, offset, order, recent });
};

export { listTaskMessages };
