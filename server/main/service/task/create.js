import { getSettings } from "../settings/get.js";
import { createTaskRun } from "./runner.js";
import { executeAgentTask } from "./executors/agent.js";
import { executeInstantTask } from "./executors/instant.js";

const TASK_RESPONSE_FORMATS = {
  json: { type: "json_object" },
  json_object: { type: "json_object" },
};

const normalizePayload = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("payload is required");
  }
  if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
    throw new Error("payload.messages is required");
  }
  const { apiKey, api_key, apiUrl, response_format, responseFormat, signal, ...requestPayload } = payload;
  return requestPayload;
};

const normalizeResponseFormat = (value) => {
  if (!value) return null;
  if (typeof value === "string") {
    const format = TASK_RESPONSE_FORMATS[value];
    if (!format) throw new Error(`Unsupported task response format: ${value}`);
    return format;
  }
  if (value?.type === "json_object") return TASK_RESPONSE_FORMATS.json_object;
  throw new Error("Unsupported task response format");
};

const buildTaskPayload = ({ payload, model, responseFormat }) => {
  const taskPayload = {
    ...normalizePayload(payload),
    model,
  };
  const format = normalizeResponseFormat(responseFormat);
  if (format) taskPayload.response_format = format;
  return taskPayload;
};

const createAgentTask = async ({
  app,
  title = "",
  payload,
  meta = null,
  wait = true,
  responseFormat = null,
  monitor = null,
}) => {
  const settings = getSettings();
  const taskPayload = buildTaskPayload({ payload, model: settings.model, responseFormat });
  return await createTaskRun({
    mode: "agent",
    app,
    title,
    payload: taskPayload,
    meta,
    wait,
    monitor,
    errorMessage: "任务执行失败",
    execute: ({ emitMessage, signal }) => executeAgentTask({
      messages: taskPayload.messages,
      settings,
      emitMessage,
      signal,
      responseFormat: taskPayload.response_format || null
    })
  });
};

const createInstantTask = async ({
  app,
  title = "",
  payload,
  meta = null,
  responseFormat = null,
  monitor = null,
}) => {
  const settings = getSettings();
  const taskPayload = buildTaskPayload({ payload, model: settings.model, responseFormat });
  return await createTaskRun({
    mode: "instant",
    app,
    title,
    payload: taskPayload,
    meta,
    monitor,
    errorMessage: "Task execution failed",
    execute: ({ signal }) => executeInstantTask({
      settings,
      signal,
      payload: taskPayload
    })
  });
};

const createAgentJsonTask = (args = {}) => createAgentTask({
  ...args,
  responseFormat: "json",
});

const createInstantJsonTask = (args = {}) => createInstantTask({
  ...args,
  responseFormat: "json",
});

export {
  createAgentTask,
  createAgentJsonTask,
  createInstantTask,
  createInstantJsonTask
};
