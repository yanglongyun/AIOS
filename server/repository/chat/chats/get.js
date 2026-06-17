// @ts-nocheck
import { getDb } from "../../db.js";

const parseChat = (row) => row && ({
  ...row,
  meta: row.meta ? JSON.parse(row.meta) : null,
});

const getChat = (chatId) => {
  const row = getDb().prepare("SELECT * FROM chats WHERE id = ?").get(String(chatId || "").trim());
  return parseChat(row);
};

export { getChat };
