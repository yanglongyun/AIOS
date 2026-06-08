// @ts-nocheck
import { listChats as selectChats } from "../../../repository/chat/chats/index.js";

const listChats = ({ limit = null, offset = 0 } = {}) =>
  selectChats({ limit, offset });

export { listChats };
