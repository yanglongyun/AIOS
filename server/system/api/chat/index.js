import { handleChatCreate } from "./create.js";
import { handleChatDelete } from "./delete.js";
import { handleChatList } from "./list.js";
import { handleChatMessages } from "./messages.js";
import { handleChatPin } from "./pin.js";
import { handleChatRename } from "./rename.js";

const handleChatApi = async (req, res, deps, path, method, url) => {
  const { sendJson } = deps;

  if (path === "/api/chat/list" && method === "GET") {
    await handleChatList(req, res, deps, url);
    return;
  }

  if (path === "/api/chat/create" && method === "POST") {
    await handleChatCreate(req, res, deps);
    return;
  }

  if (path === "/api/chat/messages" && method === "GET") {
    await handleChatMessages(req, res, deps, url);
    return;
  }

  if (path === "/api/chat/rename" && method === "POST") {
    await handleChatRename(req, res, deps);
    return;
  }

  if (path === "/api/chat/delete" && method === "POST") {
    await handleChatDelete(req, res, deps);
    return;
  }

  if (path === "/api/chat/pin" && method === "POST") {
    await handleChatPin(req, res, deps);
    return;
  }

  sendJson(res, 404, { error: "API endpoint not found" });
};

export { handleChatApi };
