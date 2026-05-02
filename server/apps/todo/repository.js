import { createAppDb } from "../app_shared/db/createAppDb.js";

const db = createAppDb("todo.db");

const initTodoDatabase = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS todos (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT    NOT NULL,
            done        INTEGER NOT NULL DEFAULT 0,
            pinned      INTEGER NOT NULL DEFAULT 0,
            task_id     INTEGER,
            task_status TEXT    NOT NULL DEFAULT '',
            note        TEXT    NOT NULL DEFAULT '',
            created_at  TEXT    DEFAULT (datetime('now')),
            updated_at  TEXT    DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_todos_done   ON todos(done);
        CREATE INDEX IF NOT EXISTS idx_todos_pinned ON todos(pinned);
    `);
};

const rowToTodo = (row) => row && {
    id:         row.id,
    title:      row.title,
    note:       row.note || "",
    done:       Boolean(row.done),
    pinned:     Boolean(row.pinned),
    taskId:     row.task_id ?? null,
    taskStatus: row.task_status || "",
    createdAt:  row.created_at,
    updatedAt:  row.updated_at,
};

const listTodos = () => {
    return db.prepare(`
        SELECT * FROM todos
        ORDER BY pinned DESC, done ASC, id DESC
    `).all().map(rowToTodo);
};

const getTodo = (id) => rowToTodo(
    db.prepare("SELECT * FROM todos WHERE id = ?").get(id)
);

const createTodo = ({ title, note = "" }) => {
    const info = db.prepare(
        "INSERT INTO todos (title, note) VALUES (?, ?)"
    ).run(title, note);
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

const deleteTodo = ({ id }) => {
    const changes = db.prepare("DELETE FROM todos WHERE id = ?").run(id).changes;
    return { deleted: changes };
};

export {
    initTodoDatabase,
    listTodos,
    getTodo,
    createTodo,
    updateTodo,
    setTaskRef,
    updateTaskStatus,
    deleteTodo,
};
