// @ts-nocheck
import { getDb } from "../db.js";
import { insertOne, lastSummaryOf, updateConversationSummaryStmt } from "./_internal.js";

const saveMessageBatch = (conversationId, messages) => {
  const db = getDb();
  const summary = lastSummaryOf(messages);
  db.exec("BEGIN");
  try {
    for (const message of messages) {
      insertOne(db, conversationId, message);
    }
    updateConversationSummaryStmt(db, conversationId, summary);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};

export { saveMessageBatch };
