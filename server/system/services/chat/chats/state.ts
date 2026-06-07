// @ts-nocheck
import { updateChatState } from "../../../repository/chat/chats/index.js";

const setChatState = ({ chatId, state = "idle" }) => updateChatState(chatId, state);

export { setChatState };
