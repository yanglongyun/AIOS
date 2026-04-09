import { agentTaskJson } from "../../app_shared/agentTask.js";
import { toDateKey } from "../../../shared/time/dateKey.js";
import { getProfileFocus, upsertProfile, insertDaily, getDailyFullByDate } from "../repository/refresh.js";
const taskAgent = async ({ prompt, taskTitle, req }) => {
  const parsed = await agentTaskJson({
    app: "subscriber",
    title: String(taskTitle || "").trim() || `订阅收报`,
    prompt: String(prompt || "").trim(),
    req
  });
  return {
    title: String(parsed.title || "").trim(),
    brief: String(parsed.brief || "").trim(),
    content: String(parsed.content || "").trim(),
    note: String(parsed.note || "").trim()
  };
};
const refresh = async (body = {}, req) => {
  const profile = getProfileFocus();
  const focus = String(body.focus || profile?.focus || "").trim();
  if (!focus) {
    return { status: 400, message: "focus is required" };
  }
  upsertProfile(focus);
  const date = toDateKey();
  const promptText = String(body.prompt || "").trim();
  if (!promptText) return { status: 400, message: "prompt is required" };
  const taskTitle = String(body.taskTitle || "").trim();
  const result = await taskAgent({ prompt: promptText, taskTitle, req });
  if (!result.title || !result.brief || !result.content) {
    return { status: 500, message: "Generated result is incomplete" };
  }
  insertDaily(date, focus, result.title, result.brief, result.content, result.note);
  const today = getDailyFullByDate(date);
  return { success: true, today };
};
export {
  refresh
};
