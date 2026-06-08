// @ts-nocheck
import { parseJson } from "../shared/json.js";
import { createTask } from "../../services/tasks/index.js";

const handleTaskPost = async (req, res, { readBody, sendJson }) => {
  const raw = await readBody(req);
  const body = parseJson(raw || "{}", "server.task.body");

  const result = createTask({
    taskName: body.name || body.taskName,
    detail: body.detail,
    messages: body.messages,
    inputOverrides: {
      apiUrl: body.apiUrl,
      apiKey: body.apiKey,
      model: body.model,
      system: body.system,
    },
    subscription: body.subscription || null,
  });

  sendJson(res, 202, {
    ok: true,
    accepted: true,
    ...result,
  });
};

export { handleTaskPost };
