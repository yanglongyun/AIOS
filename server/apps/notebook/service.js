import * as repo from "./repository.js";
import { instantTask } from "../app_shared/instantTask.js";

const clean       = (v, max = 200000) => String(v ?? "").slice(0, max);
const cleanTitle  = (v) => clean(v, 120).trim();
const cleanSum    = (v) => clean(v, 600).trim();

// ---- CRUD --------------------------------------------------------------

const listNotes = () => ({ items: repo.listNotes() });

const createNote = (body = {}) => ({
  item: repo.createNote({
    title:   cleanTitle(body.title),
    summary: cleanSum(body.summary),
    content: clean(body.content),
    pinned:  Boolean(body.pinned),
    access:  body.access,
  }),
});

const updateNote = (body = {}) => {
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) return { error: "缺少合法 id", status: 400 };
  if (!repo.getNote(id)) return { error: "笔记不存在", status: 404 };
  const patch = {};
  if (body.title   !== undefined) patch.title   = cleanTitle(body.title);
  if (body.summary !== undefined) patch.summary = cleanSum(body.summary);
  if (body.content !== undefined) patch.content = clean(body.content);
  if (body.pinned  !== undefined) patch.pinned  = Boolean(body.pinned);
  if (body.access  !== undefined) patch.access  = body.access;
  return { item: repo.updateNote({ id, ...patch }) };
};

const removeNote = (body = {}) => {
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) return { error: "缺少合法 id", status: 400 };
  return repo.deleteNote({ id });
};

// ---- AI: 三件事 ---------------------------------------------------------
// 全部 stateless —— 接收 draft 文本,返回结果。前端可在保存前调用。

const askAI = async ({ kind, label, prompt }) => {
  let result;
  try {
    result = await instantTask({
      app: "notebook",
      title: label,
      prompt,
      meta: { kind },
    });
  } catch (err) {
    return { error: err.message || "AI 调用失败", status: 502 };
  }
  const text = (result?.response || "").trim();
  if (!text) return { error: "AI 没有返回结果", status: 502 };
  return { text };
};

const aiGenerateTitle = async (body = {}) => {
  const content = clean(body.content).trim();
  if (!content) return { error: "正文为空,无法生成标题", status: 400 };
  const summary = cleanSum(body.summary);
  const prompt = [
    "请基于以下笔记内容,生成一个简洁的标题。",
    "要求:1) 不超过 20 个字 2) 不带书名号或引号 3) 直接给标题,不要任何解释或前后缀。",
    "",
    summary ? `摘要:${summary}` : null,
    "正文:",
    content,
  ].filter(Boolean).join("\n");
  const r = await askAI({ kind: "title", label: "生成标题", prompt });
  if (r.error) return r;
  return { title: r.text.replace(/^[「《"'\s]+|[」》"'\s]+$/g, "").slice(0, 80) };
};

const aiGenerateSummary = async (body = {}) => {
  const content = clean(body.content).trim();
  if (!content) return { error: "正文为空,无法生成摘要", status: 400 };
  const prompt = [
    "请基于以下笔记正文,生成一句话摘要。",
    "要求:1) 一句话,不超过 60 字 2) 直接给摘要,不要任何解释或前后缀。",
    "",
    content,
  ].join("\n");
  const r = await askAI({ kind: "summary", label: "生成摘要", prompt });
  if (r.error) return r;
  return { summary: r.text.split("\n")[0].slice(0, 200) };
};

const aiPolish = async (body = {}) => {
  const content = clean(body.content).trim();
  if (!content) return { error: "正文为空,无法润色", status: 400 };
  const prompt = [
    "请润色以下文字,保持原意、语气和段落结构,只改善表达的流畅性和准确性。",
    "直接返回润色后的全文,不要加任何解释、标题或前后说明。",
    "",
    content,
  ].join("\n");
  const r = await askAI({ kind: "polish", label: "润色", prompt });
  if (r.error) return r;
  return { content: r.text };
};

export {
  listNotes, createNote, updateNote, removeNote,
  aiGenerateTitle, aiGenerateSummary, aiPolish,
};
