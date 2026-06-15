// @ts-nocheck
// 待办业务逻辑层:领域规则、AI 任务、数据规整。
import { randomUUID } from "node:crypto";
import { createTask } from "../../../system/services/tasks/index.js";
import { waitTask, parseTaskJson } from "../../shared/ai.js";
import { badRequest } from "../../shared/http.js";
import {
  initDb,
  selectTodos,
  selectTodo,
  insertTodo,
  updateTodoRow,
  deleteTodoRow,
} from "../repository/index.js";

const DAY = 86400000;

const dateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const todayKey = () => dateKey(new Date());

const normalizeSubtasks = (value) => {
  if (!Array.isArray(value)) throw badRequest("subtasks must be an array");
  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw badRequest("subtask must be an object");
    const id = String(item.id || "").trim();
    const text = String(item.text || "").trim();
    if (!id) throw badRequest("subtask.id is required");
    if (!text) throw badRequest("subtask.text is required");
    return { id, text, done: item.done === true };
  });
};

const parseStoredSubtasks = (value) => {
  try {
    return normalizeSubtasks(JSON.parse(String(value || "[]")));
  } catch {
    return [];
  }
};
const normalizeSection = (value) => {
  if (value === "today" || value === "later") return value;
  throw badRequest("section must be today or later");
};
const normalizePriority = (value) => {
  if (value === "" || value == null || value === "high") return value || "";
  throw badRequest("priority must be high or empty");
};
const normalizeDue = (value) => {
  const text = String(value || "").trim();
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw badRequest("due must be YYYY-MM-DD");
  return text;
};
const encodeSubtasks = (value) => JSON.stringify(normalizeSubtasks(value || []));
const mapTodo = (row) => ({
  ...row,
  done: !!row.done,
  priority: row.priority || "",
  due: row.due || "",
  doneAt: row.done_at || "",
  subtasks: parseStoredSubtasks(row.subtasks),
});

const listTodos = () => selectTodos().map(mapTodo);
const getTodo = (id) => {
  const row = selectTodo(id);
  return row ? mapTodo(row) : null;
};

const createTodo = ({ text, section = "today", priority = "", subtasks = [], due = "" }) => {
  const value = String(text || "").trim();
  if (!value) throw badRequest("text is required");
  const dueValue = normalizeDue(due);
  const row = insertTodo({
    text: value,
    section: normalizeSection(section),
    priority: normalizePriority(priority),
    subtasks: encodeSubtasks(subtasks),
    due: dueValue,
  });
  return mapTodo(row);
};

const updateTodo = (id, input = {}) => {
  const todo = getTodo(id);
  if (!todo) return null;
  const done = input.done == null ? todo.done : !!input.done;
  const doneAt = done
    ? (todo.doneAt || new Date().toISOString())
    : null;
  const row = updateTodoRow(id, {
    text: input.text == null ? todo.text : String(input.text),
    done: done ? 1 : 0,
    section: input.section == null ? todo.section : normalizeSection(input.section),
    priority: input.priority == null ? todo.priority : normalizePriority(input.priority),
    subtasks: input.subtasks == null ? JSON.stringify(todo.subtasks) : encodeSubtasks(input.subtasks),
    due: input.due == null ? (todo.due || null) : normalizeDue(input.due),
    doneAt,
  });
  return mapTodo(row);
};

const deleteTodo = (id) => deleteTodoRow(id);

const runJsonTask = async ({ name, detail }) => {
  const task = createTask({ taskName: name, detail });
  return { taskId: task.taskId, data: parseTaskJson(await waitTask(task.taskId)) };
};

const parseTodo = async ({ text = "" }) => {
  const value = String(text || "").trim();
  if (!value) throw badRequest("text is required");
  const { taskId, data } = await runJsonTask({
    name: "todo-parse",
    detail: [
      "你是 AIOS 待办应用的自然语言解析任务。不要调用工具。只输出 JSON。",
      `今天日期: ${todayKey()}`,
      "输出字段固定: text, due, priority, section。",
      "due 为空字符串或 YYYY-MM-DD。priority 为 high 或空字符串。section 为 today 或 later。",
      "理解今天/明天/后天/周X/下周X/X月X日/之前/前/重要/紧急。",
      "规则: due <= 今天则 section=today; 未来 due 则 section=later; 无 due 则 section=today。",
      "",
      `用户输入: ${value}`,
    ].join("\n"),
  });
  return {
    taskId,
    result: {
      text: String(data.text || value).trim(),
      due: normalizeDue(data.due || "") || "",
      priority: normalizePriority(data.priority || ""),
      section: normalizeSection(data.section || "today"),
    },
  };
};

const decomposeTodo = async ({ text = "" }) => {
  const value = String(text || "").trim();
  if (!value) throw badRequest("text is required");
  const { taskId, data } = await runJsonTask({
    name: "todo-decompose",
    detail: [
      "你是 AIOS 待办应用的任务拆解任务。不要调用工具。只输出 JSON。",
      "把待办拆成 3 到 6 个可执行子任务。",
      "输出格式: {\"subtasks\":[\"子任务1\",\"子任务2\"]}",
      "",
      value,
    ].join("\n"),
  });
  const items = Array.isArray(data.subtasks) ? data.subtasks : [];
  return {
    taskId,
    subtasks: items.map((item) => String(item).trim()).filter(Boolean).map((item) => ({
      id: randomUUID(),
      text: item,
      done: false,
    })),
  };
};

const planToday = async () => {
  const candidates = listTodos().filter((item) => !item.done && item.section === "later").slice(0, 30);
  const { taskId, data } = await runJsonTask({
    name: "todo-plan",
    detail: [
      "你是 AIOS 待办应用的今日安排任务。不要调用工具。只输出 JSON。",
      "从稍后未完成项里选最多 3 件建议移到今天。",
      "优先级: 期限临近 > 高优先 > 搁置最久。",
      "输出格式: {\"picks\":[{\"id\":1,\"reason\":\"理由\"}],\"note\":\"一句鼓励\"}",
      "",
      JSON.stringify(candidates.map(({ id, text, due, priority, created_at }) => ({ id, text, due, priority, created_at }))),
    ].join("\n"),
  });
  const ids = new Set(candidates.map((item) => Number(item.id)));
  const picks = (Array.isArray(data.picks) ? data.picks : [])
    .map((item) => ({ id: Number(item.id), reason: String(item.reason || "").trim() }))
    .filter((item) => ids.has(item.id))
    .slice(0, 3);
  return { taskId, picks, note: String(data.note || "") };
};

export { initDb, listTodos, createTodo, updateTodo, deleteTodo, parseTodo, decomposeTodo, planToday };
