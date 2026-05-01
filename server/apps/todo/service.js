import * as repo from "./repository.js";
import { agentTaskStart } from "../app_shared/agentTask.js";
import { instantTaskJson } from "../app_shared/instantTask.js";

const trimTitle = (raw) => String(raw ?? "").trim();
const trimNote  = (raw) => String(raw ?? "").trim();

const list = () => ({ items: repo.listTodos() });

const create = (body = {}) => {
    const title = trimTitle(body.title);
    if (!title) return { error: "标题不能为空", status: 400 };
    if (title.length > 500) return { error: "标题过长(<=500)", status: 400 };
    const note = trimNote(body.note);
    let parentId = null;
    if (body.parentId !== undefined && body.parentId !== null) {
        const pid = Number(body.parentId);
        if (!Number.isInteger(pid) || pid <= 0) return { error: "parentId 不合法", status: 400 };
        const parent = repo.getTodo(pid);
        if (!parent) return { error: "父待办不存在", status: 404 };
        if (parent.parentId) return { error: "子任务不支持再嵌套子任务", status: 400 };
        parentId = pid;
    }
    return { item: repo.createTodo({ title, parentId, note }) };
};

const update = (body = {}) => {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return { error: "缺少合法 id", status: 400 };
    const existing = repo.getTodo(id);
    if (!existing) return { error: "条目不存在", status: 404 };
    const patch = {};
    if (body.title  !== undefined) {
        const t = trimTitle(body.title);
        if (!t) return { error: "标题不能为空", status: 400 };
        if (t.length > 500) return { error: "标题过长(<=500)", status: 400 };
        patch.title = t;
    }
    if (body.note   !== undefined) patch.note = trimNote(body.note);
    if (body.done   !== undefined) patch.done   = Boolean(body.done);
    if (body.pinned !== undefined) patch.pinned = Boolean(body.pinned);
    return { item: repo.updateTodo({ id, ...patch }) };
};

const remove = (body = {}) => {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return { error: "缺少合法 id", status: 400 };
    return repo.deleteTodo({ id });
};

const buildAgentPrompt = (todo) => {
    const lines = [
        "请帮我完成以下待办事项,使用你已有的工具(文件、网络、shell 等)实际推进它,而不是只回答怎么做。",
        "",
        `## 待办`,
        todo.title,
    ];
    if (todo.note) {
        lines.push("", "## 备注", todo.note);
    }
    lines.push(
        "",
        "完成后请用一段简短文字总结你做了什么、产物在哪里、是否还有需要人工介入的部分。"
    );
    return lines.join("\n");
};

const run = async (body = {}) => {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return { error: "缺少合法 id", status: 400 };
    const todo = repo.getTodo(id);
    if (!todo) return { error: "条目不存在", status: 404 };
    if (todo.taskStatus === "running" || todo.taskStatus === "pending") {
        return { error: "已有 AI 任务正在运行", status: 409 };
    }
    let started;
    try {
        started = await agentTaskStart({
            app: "todo",
            title: todo.title,
            prompt: buildAgentPrompt(todo),
            meta: { todoId: id }
        });
    } catch (err) {
        return { error: err.message || "无法启动 AI 任务", status: 502 };
    }
    const taskId = started?.id ?? started?.taskId ?? null;
    const item = repo.setTaskRef({ id, taskId, taskStatus: "running" });
    return { item, taskId, conversationId: started?.conversationId || null };
};

const updateTaskStatus = (body = {}) => {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return { error: "缺少合法 id", status: 400 };
    const status = String(body.taskStatus || "").trim();
    const allowed = new Set(["", "pending", "running", "done", "aborted", "error"]);
    if (!allowed.has(status)) return { error: "taskStatus 不合法", status: 400 };
    const existing = repo.getTodo(id);
    if (!existing) return { error: "条目不存在", status: 404 };
    return { item: repo.updateTaskStatus({ id, taskStatus: status }) };
};

const decomposeSchema = {
    type: "object",
    properties: {
        subtasks: {
            type: "array",
            minItems: 1,
            maxItems: 8,
            items: {
                type: "object",
                properties: { title: { type: "string", minLength: 1, maxLength: 200 } },
                required: ["title"]
            }
        }
    },
    required: ["subtasks"]
};

const buildDecomposePrompt = (todo) => {
    const lines = [
        "请把下面这条待办拆成 3-7 条更小、更具体、可独立完成的子任务。",
        "每条子任务用一句话(<= 30 字)描述,不要重复父待办,不要写编号。",
        "只返回 JSON,结构: { subtasks: [{ title }] }。",
        "",
        `## 父待办`,
        todo.title,
    ];
    if (todo.note) lines.push("", "## 备注", todo.note);
    return lines.join("\n");
};

const decompose = async (body = {}) => {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return { error: "缺少合法 id", status: 400 };
    const todo = repo.getTodo(id);
    if (!todo) return { error: "条目不存在", status: 404 };
    if (todo.parentId) return { error: "子任务不支持再拆分", status: 400 };
    let parsed;
    try {
        parsed = await instantTaskJson({
            app: "todo",
            title: `拆分:${todo.title}`,
            prompt: buildDecomposePrompt(todo),
            schema: decomposeSchema,
            meta: { todoId: id, kind: "decompose" }
        });
    } catch (err) {
        return { error: err.message || "AI 拆分失败", status: 502 };
    }
    const subtasks = Array.isArray(parsed?.subtasks) ? parsed.subtasks : [];
    if (!subtasks.length) return { error: "AI 没有返回任何子任务", status: 502 };
    const created = [];
    for (const sub of subtasks) {
        const t = trimTitle(sub?.title);
        if (!t) continue;
        created.push(repo.createTodo({ title: t.slice(0, 200), parentId: id }));
    }
    if (!created.length) return { error: "AI 返回的子任务都为空", status: 502 };
    return { items: created };
};

export { list, create, update, remove, run, updateTaskStatus, decompose };
