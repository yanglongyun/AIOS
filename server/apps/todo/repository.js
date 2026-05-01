import { createAppDb } from "../app_shared/db/createAppDb.js";

const db = createAppDb("todo.db");

const initTodoDatabase = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS todos (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT    NOT NULL,
            done        INTEGER NOT NULL DEFAULT 0,
            pinned      INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT    DEFAULT (datetime('now')),
            updated_at  TEXT    DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_todos_done    ON todos(done);
        CREATE INDEX IF NOT EXISTS idx_todos_pinned  ON todos(pinned);
    `);
};

const rowToTodo = (row) => row && {
    id:        row.id,
    title:     row.title,
    done:      Boolean(row.done),
    pinned:    Boolean(row.pinned),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
};

const listTodos = () => {
    const rows = db.prepare(`
        SELECT * FROM todos
        ORDER BY pinned DESC, done ASC, id DESC
    `).all();
    return rows.map(rowToTodo);
};

const getTodo = (id) => rowToTodo(
    db.prepare("SELECT * FROM todos WHERE id = ?").get(id)
);

const createTodo = ({ title }) => {
    const info = db.prepare(
        "INSERT INTO todos (title) VALUES (?)"
    ).run(title);
    return getTodo(info.lastInsertRowid);
};

const updateTodo = ({ id, title, done, pinned }) => {
    const fields = [];
    const values = [];
    if (title  !== undefined) { fields.push("title = ?");  values.push(title); }
    if (done   !== undefined) { fields.push("done = ?");   values.push(done ? 1 : 0); }
    if (pinned !== undefined) { fields.push("pinned = ?"); values.push(pinned ? 1 : 0); }
    if (!fields.length) return getTodo(id);
    fields.push("updated_at = datetime('now')");
    values.push(id);
    db.prepare(`UPDATE todos SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    return getTodo(id);
};

const deleteTodo = ({ id }) => {
    const info = db.prepare("DELETE FROM todos WHERE id = ?").run(id);
    return { deleted: info.changes };
};

export {
    initTodoDatabase,
    listTodos,
    getTodo,
    createTodo,
    updateTodo,
    deleteTodo,
};
