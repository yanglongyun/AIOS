import * as repo from "./repository.js";
import { agentTaskStart } from "../app_shared/agentTask.js";
import { instantTaskJson } from "../app_shared/instantTask.js";
import { getApiToken } from "../app_shared/apiToken.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TERMINAL = new Set(["done", "aborted", "error"]);

const fetchTaskDetail = async (taskId) => {
    const token = getApiToken();
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const url = `http://localhost:${process.env.AIOS_MAIN_PORT || 9501}/api/task/detail?id=${taskId}`;
    const resp = await fetch(url, { headers });
    if (!resp.ok) throw new Error(`task/detail ${resp.status}`);
    const data = await resp.json();
    return data?.task || null;
};

const waitForTaskTerminal = async (taskId, { intervalMs = 2000, maxWaitMs = 30 * 60 * 1000 } = {}) => {
    const t0 = Date.now();
    while (Date.now() - t0 < maxWaitMs) {
        await sleep(intervalMs);
        try {
            const task = await fetchTaskDetail(taskId);
            if (task && TERMINAL.has(task.status)) return task;
        } catch {}
    }
    throw new Error(`Timed out waiting for task ${taskId}`);
};

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

// === Sequential pipeline ===
//
// Run the plan: kick off each undone subtask in creation order, agent task per
// subtask, prompt carries the parent's goal + every prior sibling's title +
// response so the next agent can pick up where the last one left off. Stop the
// chain on the first non-done terminal status. Fire-and-forget at the HTTP
// layer — caller gets an immediate ack and watches via task statuses.

const buildPipelinePrompt = (parent, completedSiblings, current) => {
    const lines = [
        `你正在协作完成一个由用户分解为多步的任务。这是第 ${completedSiblings.length + 1} 步,共 ${completedSiblings.length + 1 + (current._remaining || 0)} 步。`,
        "",
        "## 总目标",
        parent.title,
    ];
    if (parent.note) lines.push("", parent.note);

    if (completedSiblings.length) {
        lines.push("", "## 已完成的步骤");
        completedSiblings.forEach((s, i) => {
            lines.push(`### 第 ${i + 1} 步:${s.title}`);
            if (s.response) {
                lines.push(s.response);
            } else {
                lines.push("(没有显式产物)");
            }
            lines.push("");
        });
    }

    lines.push("## 当前要完成的步骤");
    lines.push(current.title);
    if (current.note) lines.push("", current.note);

    lines.push(
        "",
        "请使用工具实际推进这一步,不要只回答怎么做。完成后用一段简短的话(<= 200 字)总结这一步的产物或结论,以便后续步骤接着用。"
    );
    return lines.join("\n");
};

const fetchSiblingResponse = async (sub) => {
    if (!sub.taskId) return null;
    try {
        const t = await fetchTaskDetail(sub.taskId);
        return t?.response || null;
    } catch {
        return null;
    }
};

const pipelineRun = async (parentId) => {
    const parent = repo.getTodo(parentId);
    if (!parent) return;
    while (true) {
        const all = repo.listChildren(parentId);
        const next = all.find((c) => !c.done && c.taskStatus !== "running" && c.taskStatus !== "pending");
        if (!next) return; // done — nothing more to run

        // Gather completed siblings in order with their responses.
        const completed = all.filter((c) => c.done && c.id !== next.id);
        const completedWithResp = [];
        for (const c of completed) {
            const response = await fetchSiblingResponse(c);
            completedWithResp.push({ title: c.title, response });
        }
        const remaining = all.filter((c) => !c.done && c.id !== next.id).length;

        const prompt = buildPipelinePrompt(parent, completedWithResp, { ...next, _remaining: remaining });

        let started;
        try {
            started = await agentTaskStart({
                app: "todo",
                title: next.title,
                prompt,
                meta: { todoId: next.id, pipelineParent: parent.id }
            });
        } catch (err) {
            repo.updateTaskStatus({ id: next.id, taskStatus: "error" });
            return; // pipeline stops
        }
        const taskId = started?.id ?? started?.taskId ?? null;
        repo.setTaskRef({ id: next.id, taskId, taskStatus: "running" });

        let final;
        try {
            final = await waitForTaskTerminal(taskId);
        } catch (err) {
            repo.updateTaskStatus({ id: next.id, taskStatus: "error" });
            return;
        }

        const finalStatus = final?.status || "error";
        repo.updateTaskStatus({ id: next.id, taskStatus: finalStatus });
        if (finalStatus !== "done") return; // halt on non-done terminal
        // Auto mark the subtask as done — the agent's response is preserved on the
        // task; the user can still toggle it back if they disagree.
        repo.updateTodo({ id: next.id, done: true });
    }
};

const runPlan = (body = {}) => {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return { error: "缺少合法 id", status: 400 };
    const parent = repo.getTodo(id);
    if (!parent) return { error: "条目不存在", status: 404 };
    if (parent.parentId) return { error: "只有父待办可以执行计划", status: 400 };
    const kids = repo.listChildren(id);
    if (!kids.length) return { error: "还没有子任务计划,先点「分解」", status: 400 };
    const undone = kids.filter((c) => !c.done);
    if (!undone.length) return { error: "所有子任务都已完成", status: 400 };
    if (kids.some((c) => c.taskStatus === "running" || c.taskStatus === "pending")) {
        return { error: "已有子任务正在运行", status: 409 };
    }
    pipelineRun(id).catch((e) => {
        // Last-ditch logging; the per-subtask error path already updates statuses.
        console.error("[todo] pipeline error:", e?.message || e);
    });
    return { started: true, parentId: id, queued: undone.length };
};

export { list, create, update, remove, run, updateTaskStatus, decompose, runPlan };
