// @ts-nocheck
// 记账本业务逻辑层:领域规则、AI 任务、数据规整。
import { createTask, getTask } from "../../../system/services/tasks/index.js";
import { badRequest } from "../../shared/http.js";
import {
  initDb,
  selectEntries,
  selectEntry,
  selectBudgetValue,
  upsertBudgetValue,
  insertEntry,
  updateEntryRow,
  deleteEntryRow,
} from "../repository/index.js";

const CATEGORIES = [
  { name: "餐饮", emoji: "🍜", color: "#e87850" },
  { name: "交通", emoji: "🚕", color: "#4e8fb8" },
  { name: "购物", emoji: "🛍️", color: "#c06aa0" },
  { name: "居住", emoji: "🏠", color: "#a06c3a" },
  { name: "娱乐", emoji: "🎮", color: "#8a6cc0" },
  { name: "医疗", emoji: "💊", color: "#50a878" },
  { name: "工资", emoji: "💼", color: "#4b9b58" },
  { name: "其他", emoji: "✨", color: "#b89545" },
];
const categorySet = new Set(CATEGORIES.map((item) => item.name));

const mapEntry = (row) => ({
  ...row,
  occurredOn: row.occurred_on,
});

const listEntries = (month = "") => selectEntries(month).map(mapEntry);

const summary = (month = "") => {
  const entries = listEntries(month);
  const income = entries.filter((x) => x.type === "income").reduce((s, x) => s + Number(x.amount || 0), 0);
  const expense = entries.filter((x) => x.type === "expense").reduce((s, x) => s + Number(x.amount || 0), 0);
  return { income, expense, balance: income - expense };
};

const getBudget = () => {
  const value = selectBudgetValue();
  try {
    return Number(JSON.parse(value || "3000")) || 3000;
  } catch {
    return 3000;
  }
};
const setBudget = (amount) => {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw badRequest("amount must be positive");
  upsertBudgetValue(JSON.stringify(value));
  return value;
};

const normalizeEntry = ({ type, amount, category = "", note = "", occurredOn }) => {
  if (type !== "income" && type !== "expense") throw badRequest("type must be income or expense");
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw badRequest("amount must be positive");
  const cat = String(category || "").trim();
  if (!categorySet.has(cat)) throw badRequest("category is invalid");
  const day = String(occurredOn || "").trim();
  if (day && !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw badRequest("occurredOn must be YYYY-MM-DD");
  return { type, amount: value, category: cat, note: String(note || "").trim(), occurredOn: day };
};

const createEntry = (input) => {
  const entry = normalizeEntry(input || {});
  return mapEntry(insertEntry(entry));
};

const updateEntry = (id, input = {}) => {
  const current = selectEntry(id);
  if (!current) return null;
  const entry = normalizeEntry({
    type: input.type == null ? current.type : input.type,
    amount: input.amount == null ? current.amount : input.amount,
    category: input.category == null ? current.category : input.category,
    note: input.note == null ? current.note : input.note,
    occurredOn: input.occurredOn == null ? current.occurred_on : input.occurredOn,
  });
  return mapEntry(updateEntryRow(id, entry));
};

const deleteEntry = (id) => deleteEntryRow(id);

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

const parseEntry = async ({ text = "" }) => {
  const value = String(text || "").trim();
  if (!value) throw badRequest("text is required");
  const task = createTask({
    taskName: "ledger-parse",
    detail: [
      "你是 AIOS 记账本的智能输入解析任务。不要调用工具。只输出 JSON。",
      "输出字段固定为 type, amount, category, note, occurredOn。",
      "type 只能是 expense 或 income。",
      `category 从 ${CATEGORIES.map((item) => item.name).join("、")} 中选择。`,
      "amount 是正数。",
      "occurredOn 支持用户说的昨天/前天/X月X日;如果用户没明确日期,输出空字符串。",
      "",
      `今天: ${new Date().toISOString().slice(0, 10)}`,
      `用户输入: ${value}`,
    ].join("\n"),
  });
  const parsed = JSON.parse(await waitTask(task.taskId));
  return { taskId: task.taskId, entry: normalizeEntry(parsed) };
};

const smartRecord = async ({ text = "" }) => {
  const value = String(text || "").trim();
  if (!value) throw badRequest("text is required");
  const today = new Date().toISOString().slice(0, 10);
  const task = createTask({
    taskName: "ledger-smart",
    detail: [
      "你是 AIOS 记账本的智能记账任务。不要调用工具,不要输出多余文字,只输出 JSON。",
      "把用户输入解析成一条或多条账目,输出格式固定为:",
      '{"entries":[{"type":"expense|income","amount":数字,"name":"名称","category":"分类","date":"YYYY-MM-DD","note":"可选备注"}]}',
      "规则:",
      "- type 只能是 expense(支出) 或 income(收入),发工资/收款等是 income,其余默认 expense。",
      "- amount 是正数。",
      `- category 从 ${CATEGORIES.map((item) => item.name).join("、")} 中选择,没有合适的用「其他」。`,
      "- date 是 YYYY-MM-DD;相对日期(昨天/前天/上周三等)要换算成具体日期;用户没说日期则用今天。",
      "- 一句话里包含多笔账目时输出多条 entries。",
      "- 解析不出任何账目时输出 {\"entries\":[]}。",
      "",
      `今天: ${today}`,
      `用户输入: ${value}`,
    ].join("\n"),
  });
  let parsed;
  try {
    parsed = JSON.parse(await waitTask(task.taskId));
  } catch {
    throw badRequest("AI 输出无法解析");
  }
  const list = Array.isArray(parsed?.entries) ? parsed.entries : [];
  const inserted = [];
  let skipped = 0;
  for (const item of list) {
    try {
      const type = item?.type === "income" ? "income" : item?.type === "expense" ? "expense" : null;
      const amount = Number(item?.amount);
      const date = String(item?.date || today).trim();
      if (!type || !Number.isFinite(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { skipped += 1; continue; }
      const category = categorySet.has(String(item?.category || "").trim()) ? String(item.category).trim() : "其他";
      const name = String(item?.name || "").trim();
      const extra = String(item?.note || "").trim();
      const note = name && extra && extra !== name ? `${name}（${extra}）` : name || extra;
      inserted.push(createEntry({ type, amount, category, note, occurredOn: date }));
    } catch {
      skipped += 1;
    }
  }
  return { taskId: task.taskId, entries: inserted, skipped };
};

export { initDb, CATEGORIES, listEntries, summary, getBudget, setBudget, createEntry, updateEntry, deleteEntry, parseEntry, smartRecord };
