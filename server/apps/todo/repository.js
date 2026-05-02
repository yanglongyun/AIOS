import { createAppDb } from "../app_shared/db/createAppDb.js";

const db = createAppDb("todo.db");

const initTodoDatabase = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS todos (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT    NOT NULL,
            done        INTEGER NOT NULL DEFAULT 0,
            pinned      INTEGER NOT NULL DEFAULT 0,
            parent_id   INTEGER,
            task_id     INTEGER,
            task_status TEXT    NOT NULL DEFAULT '',
            note        TEXT    NOT NULL DEFAULT '',
            created_at  TEXT    DEFAULT (datetime('now')),
            updated_at  TEXT    DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_todos_done    ON todos(done);
        CREATE INDEX IF NOT EXISTS idx_todos_pinned  ON todos(pinned);
        CREATE INDEX IF NOT EXISTS idx_todos_parent  ON todos(parent_id);
    `);
};

const rowToTodo = (row) => row && {
    id:         row.id,
    parentId:   row.parent_id ?? null,
    title:      row.title,
    note:       row.note || "",
    done:       Boolean(row.done),
    pinned:     Boolean(row.pinned),
    taskId:     row.task_id ?? null,
    taskStatus: row.task_status || "",
    createdAt:  row.created_at,
    updatedAt:  row.updated_at,
};

// Sort: pinned first, undone first, newest first — but parents always own the
// space their children render in. Children are returned right after their parent.
const listTodos = () => {
    const rows = db.prepare(`
        SELECT * FROM todos
        ORDER BY pinned DESC, done ASC, id DESC
    `).all().map(rowToTodo);
    const parents = rows.filter((r) => !r.parentId);
    const childrenByParent = new Map();
    for (const r of rows) {
        if (!r.parentId) continue;
        if (!childrenByParent.has(r.parentId)) childrenByParent.set(r.parentId, []);
        childrenByParent.get(r.parentId).push(r);
    }
    const out = [];
    for (const p of parents) {
        out.push(p);
        const kids = childrenByParent.get(p.id) || [];
        // Children: undone first, by id ASC (creation order) — feels natural for steps.
        kids.sort((a, b) => {
            if (a.done !== b.done) return a.done ? 1 : -1;
            return a.id - b.id;
        });
        for (const k of kids) out.push(k);
    }
    // Orphan children (parent deleted) — show at the bottom as top-level.
    const seen = new Set(out.map((r) => r.id));
    for (const r of rows) if (!seen.has(r.id)) out.push(r);
    return out;
};

const getTodo = (id) => rowToTodo(
    db.prepare("SELECT * FROM todos WHERE id = ?").get(id)
);

// Subtasks of a parent, in creation order (the natural execution order).
const listChildren = (parentId) => {
    const rows = db.prepare(
        "SELECT * FROM todos WHERE parent_id = ? ORDER BY id ASC"
    ).all(parentId);
    return rows.map(rowToTodo);
};

const createTodo = ({ title, parentId = null, note = "" }) => {
    const info = db.prepare(
        "INSERT INTO todos (title, parent_id, note) VALUES (?, ?, ?)"
    ).run(title, parentId, note);
    return getTodo(info.lastInsertRowid);
};

const updateTodo = ({ id, title, done, pinned, note }) => {
    const fields = [];
    const values = [];
    if (title  !== undefined) { fields.push("title = ?");  values.push(title); }
    if (done   !== undefined) { fields.push("done = ?");   values.push(done ? 1 : 0); }
    if (pinned !== undefined) { fields.push("pinned = ?"); values.push(pinned ? 1 : 0); }
    if (note   !== undefined) { fields.push("note = ?");   values.push(note); }
    if (!fields.length) return getTodo(id);
    fields.push("updated_at = datetime('now')");
    values.push(id);
    db.prepare(`UPDATE todos SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    return getTodo(id);
};

const setTaskRef = ({ id, taskId, taskStatus }) => {
    db.prepare(
        "UPDATE todos SET task_id = ?, task_status = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(taskId, taskStatus, id);
    return getTodo(id);
};

const updateTaskStatus = ({ id, taskStatus }) => {
    db.prepare(
        "UPDATE todos SET task_status = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(taskStatus, id);
    return getTodo(id);
};

// Delete a todo and all its children (one level) in a single transaction.
const deleteTodo = ({ id }) => {
    const tx = db.transaction(() => {
        const kidIds = db.prepare("SELECT id FROM todos WHERE parent_id = ?").all(id).map((r) => r.id);
        let total = 0;
        for (const kid of kidIds) {
            total += db.prepare("DELETE FROM todos WHERE id = ?").run(kid).changes;
        }
        total += db.prepare("DELETE FROM todos WHERE id = ?").run(id).changes;
        return total;
    });
    return { deleted: tx() };
};

export {
    initTodoDatabase,
    listTodos,
    listChildren,
    getTodo,
    createTodo,
    updateTodo,
    setTaskRef,
    updateTaskStatus,
    deleteTodo,
};
