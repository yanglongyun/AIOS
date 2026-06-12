// @ts-nocheck
// 待办数据层:建库、迁移、全部 SQL。
import { createAppDb } from "../../shared/db.js";

let db;

const hasColumn = (table, name) =>
  db.prepare(`PRAGMA table_info(${table})`).all().some((row) => row.name === name);

const createSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      section TEXT NOT NULL DEFAULT 'today' CHECK (section IN ('today', 'later')),
      priority TEXT,
      subtasks TEXT NOT NULL DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  if (!hasColumn("todos", "due")) db.exec("ALTER TABLE todos ADD COLUMN due TEXT");
  if (!hasColumn("todos", "done_at")) db.exec("ALTER TABLE todos ADD COLUMN done_at DATETIME");
};

const initDb = () => {
  if (db) return db;
  db = createAppDb("todo.db");
  createSchema();
  return db;
};

const selectTodos = () => db.prepare(`
  SELECT * FROM todos
  ORDER BY
    done ASC,
    CASE section WHEN 'today' THEN 0 ELSE 1 END,
    CASE priority WHEN 'high' THEN 0 ELSE 1 END,
    COALESCE(due, '9999-99-99') ASC,
    id DESC
`).all();

const selectTodo = (id) => db.prepare("SELECT * FROM todos WHERE id = ?").get(Number(id));

const insertTodo = ({ text, section, priority, subtasks, due }) =>
  db.prepare(`
    INSERT INTO todos (text, section, priority, subtasks, due)
    VALUES (?, ?, ?, ?, ?)
    RETURNING *
  `).get(text, section, priority, subtasks, due);

const updateTodoRow = (id, { text, done, section, priority, subtasks, due, doneAt }) =>
  db.prepare(`
    UPDATE todos
    SET text = ?, done = ?, section = ?, priority = ?, subtasks = ?, due = ?,
        done_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    RETURNING *
  `).get(text, done, section, priority, subtasks, due, doneAt, Number(id));

const deleteTodoRow = (id) => db.prepare("DELETE FROM todos WHERE id = ?").run(Number(id));

export { initDb, selectTodos, selectTodo, insertTodo, updateTodoRow, deleteTodoRow };
