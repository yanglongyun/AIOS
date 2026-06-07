// @ts-nocheck
import { searchChats as searchChatRows } from "../../../repository/chat/chats/index.js";

const searchChats = ({ query = "", scene = null, limit = null, offset = 0 } = {}) =>
  searchChatRows({ scene, query, limit, offset });

export { searchChats };
