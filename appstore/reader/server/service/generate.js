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
    out.push(locale === "en" ? `Continue option ${out.length + 1}` : `继续行动 ${out.length + 1}`);
  }
  return out;
};
const generate = async ({ sessionId, action, prompt, locale, taskTitle, req }) => {
  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return { status: 400, message: "Invalid sessionId" };
  }
  const session = findSessionById(sessionId);
  if (!session) return { status: 404, message: "Story not found" };
  const promptText = String(prompt || "").trim();
  if (!promptText) return { status: 400, message: "prompt is required" };
  const lang = normalizeLocale(locale);
  const actionText = String(action || "").trim() || (lang === "en" ? "Start Reader" : "开始阅读");
  const title = String(taskTitle || "").trim() || (lang === "en" ? `Story Progress #${sessionId}` : `故事推进 #${sessionId}`);
  const result = await agentTaskJson({
    app: "reader",
    title,
    prompt: promptText,
    req
  });
  const content = String(result.content || "").trim();
  if (!content) return { status: 500, message: "Generated result is missing content" };
  const choices = normalizeChoices(result.choices, lang);
  const summary = String(result.summary || "").trim() || content.slice(0, 120);
  const progress = String(result.progress || "").trim() || (lang === "en" ? "Chapter" : "章节推进");
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
