// @ts-nocheck
import { listChats as selectChats } from "../../../repository/chat/chats/index.js";

const listChats = ({ scene = null, limit = null, offset = 0 } = {}) =>
  selectChats({ scene, limit, offset });

export { listChats };
