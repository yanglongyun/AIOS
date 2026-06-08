// @ts-nocheck
import { searchChats as searchChatRows } from "../../../repository/chat/chats/index.js";

const searchChats = ({ query = "", limit = null, offset = 0 } = {}) =>
  searchChatRows({ query, limit, offset });

export { searchChats };
