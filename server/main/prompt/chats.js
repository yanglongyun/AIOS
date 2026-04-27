import { db } from "../repository/client.js";
const recentChats = () => {
  return db.prepare(`
    SELECT conversation_id, title, description
    FROM chats
    ORDER BY datetime(created_at) DESC, id DESC
    LIMIT 3
  `).all().map((row) => ({
    conversationId: row.conversation_id,
    title: String(row.title || "").trim(),
    description: String(row.description || "").trim().slice(0, 100)
  }));
};
const chats = (currentConversationId) => {
  const currentId = String(currentConversationId || "").trim();
  const list = recentChats();
  if (!currentId && (!Array.isArray(list) || list.length === 0)) return "";
  const recentLines = list.slice(0, 3).map((c, i) => `${i + 1}. ${c.title || "Untitled"} | ${String(c.description || "").slice(0, 100)}`);
  let block = `

## Conversation Context`;
  if (currentId) {
    block += `
- Current conversation ID: ${currentId}`;
  }
  if (recentLines.length) {
    block += `
- Last 3 conversations (title | first 100 chars of description):
${recentLines.join("\n")}`;
  }
  return block;
};
export {
  chats
};
