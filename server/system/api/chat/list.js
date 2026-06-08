// @ts-nocheck
import { listChats, searchChats } from "../../services/chat/index.js";
import { asLimit, asOffset } from "./shared.js";

const handleChatList = async (_req, res, { sendJson }, url) => {
  const search = url.searchParams.get("search") || "";
  const options = {
    limit: url.searchParams.has("limit") ? asLimit(url.searchParams.get("limit")) : null,
    offset: asOffset(url.searchParams.get("offset")),
  };
  const result = search.trim()
    ? searchChats({ ...options, query: search })
    : listChats(options);
  sendJson(res, 200, result.rows);
};

export { handleChatList };
