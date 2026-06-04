// @ts-nocheck
import { getDb } from "../db.js";
import { insertOne, updateConversationSummaryStmt } from "./_internal.js";

const appendMessage = (conversationId, message) => {
  const db = getDb();
  const messageId = insertOne(db, conversationId, message);
  updateConversationSummaryStmt(db, conversationId, message?.summary ? String(message.summary) : null);
  return messageId;
};

export { appendMessage };
