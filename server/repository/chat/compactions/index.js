// @ts-nocheck
import { getDb } from "../../db.js";

const parseRow = (row) => row && ({
  id: row.id,
  chat_id: row.chat_id,
  start_message_id: row.start_message_id,
  end_message_id: row.end_message_id,
  summary: row.summary,
  tokens: row.tokens,
  created_at: row.created_at,
});

const listCompactions = (chatId) => {
  const rows = getDb().prepare(`
    SELECT *
    FROM compactions
    WHERE chat_id = ?
    ORDER BY id ASC
  `).all(String(chatId || "").trim());
  return rows.map(parseRow);
};

const getLatestCompaction = (chatId) => {
  const row = getDb().prepare(`
    SELECT *
    FROM compactions
    WHERE chat_id = ?
    ORDER BY id DESC
    LIMIT 1
  `).get(String(chatId || "").trim());
  return parseRow(row);
};

const createCompaction = ({ chatId, startMessageId, endMessageId, summary, tokens = 0 }) => {
  const result = getDb().prepare(`
    INSERT INTO compactions (chat_id, start_message_id, end_message_id, summary, tokens)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    String(chatId || "").trim(),
    Number(startMessageId) || 0,
    Number(endMessageId) || 0,
    String(summary || ""),
    Number(tokens) || 0,
  );
  return Number(result.lastInsertRowid);
};

export { createCompaction, getLatestCompaction, listCompactions };
