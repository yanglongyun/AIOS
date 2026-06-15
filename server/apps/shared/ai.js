// @ts-nocheck
// 应用 AI 任务公共件:轮询等待 system 任务完成、解析 JSON 结果。
// 应用在 service 层用 createTask(...) 起任务,再用 waitTask 取结果。
import { getTask } from "../../system/services/tasks/index.js";

// 轮询任务直到终态。done -> 返回 response 文本;error/aborted/timeout -> 抛错。
const waitTask = async (taskId, timeoutMs = 45000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const task = getTask(taskId);
    if (task?.status === "done") return task.response || "";
    if (task?.status === "error") throw new Error(task.error || "task failed");
    if (task?.status === "aborted") throw new Error("task aborted");
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("task timeout");
};

// 容错解析 AI 返回的 JSON;非 JSON 时退回 { content: 原文 }。
const parseTaskJson = (content) => {
  try {
    return JSON.parse(String(content || "{}"));
  } catch {
    return { content: String(content || "") };
  }
};

export { waitTask, parseTaskJson };
