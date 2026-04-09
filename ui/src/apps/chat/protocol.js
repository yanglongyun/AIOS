const request = (intent, payload = {}) => ({
  requestId: `chat-protocol-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  intent,
  payload
});

const requireMessage = (data = {}) => {
  const message = String(data.message || "").trim();
  if (!message) {
    throw new Error("chat protocol requires a non-empty message");
  }
  return message;
};

const requireConversationId = (data = {}) => {
  const conversationId = String(data.conversationId || "").trim();
  if (!conversationId) {
    throw new Error("chat protocol requires conversationId");
  }
  return conversationId;
};

const protocol = {
  async open({ payload, existingWindow, openWindow, focusWindow }) {
    const action = payload.action || "open";
    const data = payload.data || {};

    if (action === "open") {
      if (existingWindow) {
        focusWindow(existingWindow.id);
        return existingWindow;
      }
      return openWindow();
    }

    if (action === "open_new") {
      return openWindow({
        id: null,
        pendingMessage: null,
        protocolRequest: request("new")
      });
    }

    if (action === "open_new_and_send") {
      return openWindow({
        id: null,
        pendingMessage: null,
        protocolRequest: request("new_and_send", { message: requireMessage(data) })
      });
    }

    if (action === "load_conversation") {
      const conversationId = requireConversationId(data);
      return openWindow({
        id: conversationId,
        pendingMessage: null,
        protocolRequest: request("load_conversation", { conversationId })
      });
    }

    throw new Error(`Unsupported chat protocol action: ${action}`);
  }
};

export {
  protocol
};
