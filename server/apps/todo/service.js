import * as repo from "./repository.js";

const trimTitle = (raw) => String(raw ?? "").trim();

const list = () => ({ items: repo.listTodos() });

const create = (body = {}) => {
    const title = trimTitle(body.title);
    if (!title) return { error: "标题不能为空", status: 400 };
    if (title.length > 500) return { error: "标题过长(<=500)", status: 400 };
    return { item: repo.createTodo({ title }) };
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
    if (body.done   !== undefined) patch.done   = Boolean(body.done);
    if (body.pinned !== undefined) patch.pinned = Boolean(body.pinned);
    return { item: repo.updateTodo({ id, ...patch }) };
};

const remove = (body = {}) => {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return { error: "缺少合法 id", status: 400 };
    return repo.deleteTodo({ id });
};

export { list, create, update, remove };
