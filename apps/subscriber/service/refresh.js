import { agentTaskJson } from "../../app_shared/agentTask.js";
import { toDateKey } from "../../../shared/time/dateKey.js";
import { getProfileFocus, upsertProfile, insertDaily, getDailyFullByDate } from "../repository/refresh.js";
const taskAgent = async ({ prompt, taskTitle, req }) => {
  const parsed = await agentTaskJson({
    app: "subscriber",
    title: String(taskTitle || "").trim() || `\u8BA2\u9605\u6536\u62A5`,
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
    return { status: 400, message: "focus \u4E0D\u80FD\u4E3A\u7A7A" };
  }
  upsertProfile(focus);
  const date = toDateKey();
  const promptText = String(body.prompt || "").trim();
  if (!promptText) return { status: 400, message: "prompt \u4E0D\u80FD\u4E3A\u7A7A" };
  const taskTitle = String(body.taskTitle || "").trim();
  const result = await taskAgent({ prompt: promptText, taskTitle, req });
  if (!result.title || !result.brief || !result.content) {
    return { status: 500, message: "\u751F\u6210\u7ED3\u679C\u4E0D\u5B8C\u6574" };
  }
  insertDaily(date, focus, result.title, result.brief, result.content, result.note);
  const today = getDailyFullByDate(date);
  return { success: true, today };
};
export {
  refresh
};
