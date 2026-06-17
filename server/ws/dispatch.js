// @ts-nocheck
import { chatWebSocketHandlers } from "./chat/index.js";

const handlers = {
  ping: async ({ emit }) => emit({ type: "pong" }),
  ...chatWebSocketHandlers,
};

const dispatchWebSocketEvent = async (context, payload = {}) => {
  const type = String(payload.type || "").trim();
  const handler = handlers[type];
  if (!handler) {
    context.emit({ type: "socket.error", content: `unknown event type: ${type || "(empty)"}` });
    return;
  }
  await handler({ ...context, type, payload });
};

export { dispatchWebSocketEvent };
