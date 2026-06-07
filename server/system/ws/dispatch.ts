// @ts-nocheck
import { chatWebSocketHandlers } from "./chat/index.js";

const handlers = {
  ping: async ({ emit }) => {
    emit({ type: "pong" });
  },
  ...chatWebSocketHandlers,
};

const readType = (payload = {}) => String(payload.type || "").trim();

const dispatchWebSocketEvent = async (context, payload = {}) => {
  const type = readType(payload);
  const handler = handlers[type];

  if (!handler) {
    context.emit({
      type: "socket.error",
      content: `unknown event type: ${type || "(empty)"}`,
    });
    return;
  }

  await handler({ ...context, type, payload });
};

export { dispatchWebSocketEvent };
