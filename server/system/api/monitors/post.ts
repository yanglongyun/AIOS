// @ts-nocheck
import { parseJson } from "../../utils.js";
import { createMonitor } from "../../services/monitors/index.js";

const handleMonitorPost = async (req, res, { readBody, sendJson }) => {
  const raw = await readBody(req);
  const body = parseJson(raw || "{}", "server.monitor.body");
  try {
    const monitor = createMonitor({
      title: body.title,
      kind: body.kind,
      sourceId: body.sourceId,
      event: body.event,
      targetMode: body.targetMode,
      conversationId: body.conversationId,
      chatTitle: body.chatTitle,
      prompt: body.prompt,
      createdByType: body.createdByType || "user",
      createdByRef: body.createdByRef,
    });
    sendJson(res, 201, { ok: true, monitor });
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error.message });
  }
};

export { handleMonitorPost };
