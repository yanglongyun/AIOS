// @ts-nocheck
import { setChatState } from "./chats.js";
import { chatControllers } from "./controllers.js";

const abortChat = (chatId) => {
  const id = String(chatId || "").trim();
  if (!id) throw new Error("chatId is required");
  const controller = chatControllers.get(id);
  if (controller) {
    controller.abort();
    return { ok: true, aborted: true };
  }
  setChatState({ chatId: id, state: "idle" });
  return { ok: true, aborted: false };
};

export { abortChat };
