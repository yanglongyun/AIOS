// @ts-nocheck
import { executeAgentTask } from "./executors/agent.js";
import { createTaskRun } from "./runner.js";

const createTask = ({ taskName, detail, messages, inputOverrides = {}, monitor = null }) => {
  const initialMessages = Array.isArray(messages)
    ? messages
    : String(detail || "").trim()
      ? [{ role: "user", content: String(detail).trim() }]
      : [];

  if (initialMessages.length === 0) {
    throw new Error("detail is required");
  }

  return createTaskRun({
    taskName,
    initialMessages,
    input: {
      ...inputOverrides,
    },
    execute: executeAgentTask,
    monitor,
  });
};

export { createTask };
