// @ts-nocheck
import { getDb } from "../../db.js";
import { getChat } from "./get.js";

const updateChatState = (chatId, state = "idle") => {
  const id = String(chatId || "").trim();
  if (!id) throw new Error("chatId is required");
  const next = state === "running" ? "running" : "idle";

  getDb()
    .prepare("UPDATE chats SET state = ? WHERE id = ?")
    .run(next, id);

  return getChat(id);
};

export { updateChatState };
