// @ts-nocheck
// 记事本业务逻辑层:领域规则、AI 任务、数据规整。
import { createTask } from "../../../system/services/tasks/index.js";
import { waitTask, parseTaskJson } from "../../shared/ai.js";
import { badRequest } from "../../shared/http.js";
import {
  initDb,
  selectFolders,
  selectNotes,
  selectNote,
  insertFolder,
  insertNote,
  updateNoteRow,
  deleteNoteRow,
} from "../repository/index.js";

const COLORS = ["#a06c3a", "#5b8a4e", "#b0719a", "#4e7a8a", "#8a6c4e"];

const parseTags = (value) => {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed.map((item) => String(item).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
};

const normalizeTags = (value) => {
  if (typeof value === "string") {
    return [...new Set(value.split(/[#,，\s]+/).map((item) => item.trim()).filter(Boolean))];
  }
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
};

const encodeTags = (value) => JSON.stringify(normalizeTags(value));

const mapNote = (row) => ({
  ...row,
  tags: parseTags(row.tags),
  pinned: !!row.pinned,
});

const listFolders = () => selectFolders();
const listNotes = () => selectNotes().map(mapNote);
const getNote = (id) => {
  const row = selectNote(id);
  return row ? mapNote(row) : null;
};

const createFolder = ({ name = "" }) => {
  const value = String(name || "").trim();
  if (!value) throw badRequest("name is required");
  const color = COLORS[Math.abs(value.split("").reduce((n, ch) => n + ch.charCodeAt(0), 0)) % COLORS.length];
  return insertFolder(value, color);
};

const createNote = ({ title = "", content = "", folder = "", tags = [], pinned = false, emoji = "", color = "" }) =>
  mapNote(insertNote({
    title: String(title || ""),
    content: String(content || ""),
    folder: String(folder || ""),
    tags: encodeTags(tags),
    pinned: pinned ? 1 : 0,
    emoji: String(emoji || ""),
    color: String(color || ""),
  }));

const updateNote = (id, input = {}) => {
  const note = getNote(id);
  if (!note) return null;
  return mapNote(updateNoteRow(id, {
    title: input.title == null ? note.title : String(input.title),
    content: input.content == null ? note.content : String(input.content),
    folder: input.folder == null ? note.folder : String(input.folder || ""),
    tags: input.tags == null ? JSON.stringify(note.tags) : encodeTags(input.tags),
    pinned: input.pinned == null ? (note.pinned ? 1 : 0) : (input.pinned ? 1 : 0),
    emoji: input.emoji == null ? note.emoji : String(input.emoji || ""),
    color: input.color == null ? note.color : String(input.color || ""),
  }));
};

const deleteNote = (id) => deleteNoteRow(id);

const polishPrompts = {
  polish: {
    label: "润色",
    instruction: "润色下面这段笔记。保留原意,让表达更自然、清晰、有质感。只输出 JSON: {\"content\":\"润色后的正文\"}",
  },
  condense: {
    label: "精简",
    instruction: "精简下面这段笔记。保留关键信息,去掉重复和松散表达。只输出 JSON: {\"content\":\"精简后的正文\"}",
  },
  expand: {
    label: "扩写",
    instruction: "扩写下面这段笔记。基于原意补足细节和结构,不要编造具体事实。只输出 JSON: {\"content\":\"扩写后的正文\"}",
  },
  title: {
    label: "起标题",
    instruction: "给下面这段笔记起一个 14 个汉字以内的标题。只输出 JSON: {\"content\":\"标题\"}",
  },
  format: {
    label: "排版",
    instruction: "把下面这段笔记整理成清晰 Markdown,可使用标题、列表、任务清单和引用。只输出 JSON: {\"content\":\"Markdown 正文\"}",
  },
};

const polishNote = async ({ content = "", mode = "polish", prompt: userPrompt = "" }) => {
  const text = String(content || "").trim();
  if (mode === "ask") {
    const ask = String(userPrompt || "").trim();
    if (!ask) throw badRequest("prompt is required");
    const task = createTask({
      taskName: "notepad-ask",
      detail: [
        "你是 AIOS 记事本应用的写作助手。不要调用工具,不要保存数据。",
        "根据用户的要求产出一段可直接追加到笔记末尾的内容。只输出 JSON: {\"content\":\"产出内容\"}",
        "",
        "用户要求:",
        ask,
        "",
        "当前笔记内容(上下文,可为空):",
        text,
      ].join("\n"),
    });
    const data = parseTaskJson(await waitTask(task.taskId));
    return {
      taskId: task.taskId,
      result: { mode, label: "AI", content: String(data.content || "").trim() },
    };
  }
  if (!text && mode !== "expand") throw badRequest("content is required");
  const prompt = polishPrompts[mode];
  if (!prompt) throw badRequest("mode must be polish, condense, expand, title, format, or ask");
  const task = createTask({
    taskName: `notepad-${mode}`,
    detail: [
      "你是 AIOS 记事本应用的写作任务。不要调用工具,不要保存数据。",
      prompt.instruction,
      "",
      "笔记内容:",
      text || "这是一篇空白笔记,请给出可继续写作的开头。",
    ].join("\n"),
  });
  const data = parseTaskJson(await waitTask(task.taskId));
  return {
    taskId: task.taskId,
    result: {
      mode,
      label: prompt.label,
      content: String(data.content || "").trim(),
    },
  };
};

export { initDb, listFolders, listNotes, createFolder, createNote, updateNote, deleteNote, polishNote };
