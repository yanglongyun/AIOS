import { agentTaskJson } from "../../app_shared/agentTask.js";
import { findSessionById, countChapters, insertChapter, updateSessionProgress } from "../repository/generate.js";
const normalizeLocale = (value) => String(value || "").toLowerCase() === "en" ? "en" : "zh";
const normalizeChoices = (choices = [], locale = "zh") => {
  const out = [];
  for (const c of choices) {
    const text = (typeof c === "object" && c !== null ? c.text || c.action || c.label || JSON.stringify(c) : String(c || "")).trim();
    if (!text) continue;
    out.push(text);
    if (out.length >= 3) break;
  }
  while (out.length < 3) {
    out.push(locale === "en" ? `Continue option ${out.length + 1}` : `\u7EE7\u7EED\u884C\u52A8 ${out.length + 1}`);
  }
  return out;
};
const generate = async ({ sessionId, action, prompt, locale, taskTitle, req }) => {
  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return { status: 400, message: "sessionId \u65E0\u6548" };
  }
  const session = findSessionById(sessionId);
  if (!session) return { status: 404, message: "\u6545\u4E8B\u4E0D\u5B58\u5728" };
  const promptText = String(prompt || "").trim();
  if (!promptText) return { status: 400, message: "prompt \u4E0D\u80FD\u4E3A\u7A7A" };
  const lang = normalizeLocale(locale);
  const actionText = String(action || "").trim() || (lang === "en" ? "Start Reader" : "\u5F00\u59CB\u9605\u8BFB");
  const title = String(taskTitle || "").trim() || (lang === "en" ? `Story Progress #${sessionId}` : `\u6545\u4E8B\u63A8\u8FDB #${sessionId}`);
  const result = await agentTaskJson({
    app: "reader",
    title,
    prompt: promptText,
    req
  });
  const content = String(result.content || "").trim();
  if (!content) return { status: 500, message: "\u751F\u6210\u7ED3\u679C\u7F3A\u5C11 content" };
  const choices = normalizeChoices(result.choices, lang);
  const summary = String(result.summary || "").trim() || content.slice(0, 120);
  const progress = String(result.progress || "").trim() || (lang === "en" ? "Chapter" : "\u7AE0\u8282\u63A8\u8FDB");
  const prevCount = countChapters(sessionId);
  const idx = prevCount + 1;
  insertChapter({
    sessionId,
    idx,
    action: actionText,
    content,
    choicesJson: JSON.stringify(choices),
    summary,
    progress
  });
  updateSessionProgress({ sessionId, summary, progress, chapterCount: idx });
  return { success: true, chapter: { idx, action: actionText, content, choices, summary, progress } };
};
export {
  generate
};
