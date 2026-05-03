import { createAppDb } from "../app_shared/db/createAppDb.js";

const db = createAppDb("demo.db");

const initDemoDatabase = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS projects (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            topic       TEXT    NOT NULL,
            created_at  TEXT    DEFAULT (datetime('now')),
            updated_at  TEXT    DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS plans (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id  INTEGER NOT NULL,
            slug        TEXT    NOT NULL,
            title       TEXT    NOT NULL,
            description TEXT    NOT NULL DEFAULT '',
            sort_order  INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            plan_id     INTEGER NOT NULL,
            status      TEXT    NOT NULL DEFAULT 'pending',
            attempt     INTEGER NOT NULL DEFAULT 1,
            error       TEXT,
            started_at  TEXT,
            finished_at TEXT,
            created_at  TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS results (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id     INTEGER NOT NULL,
            html        TEXT    NOT NULL,
            created_at  TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_plans_project ON plans(project_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_plan    ON tasks(plan_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_status  ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_results_task  ON results(task_id);
    `);
    db.pragma("foreign_keys = ON");
};

const rowToProject = (r) => r && {
    id: r.id, topic: r.topic, createdAt: r.created_at, updatedAt: r.updated_at,
};
const rowToPlan = (r) => r && {
    id: r.id, projectId: r.project_id, slug: r.slug, title: r.title, description: r.description || "",
    sortOrder: r.sort_order, createdAt: r.created_at,
};
const rowToTask = (r) => r && {
    id: r.id, planId: r.plan_id, status: r.status, attempt: r.attempt,
    error: r.error || "", startedAt: r.started_at, finishedAt: r.finished_at, createdAt: r.created_at,
};
const rowToResult = (r) => r && {
    id: r.id, taskId: r.task_id, html: r.html, createdAt: r.created_at,
};

// projects
const insertProject = ({ topic }) => {
    const info = db.prepare("INSERT INTO projects (topic) VALUES (?)").run(topic);
    return rowToProject(db.prepare("SELECT * FROM projects WHERE id = ?").get(info.lastInsertRowid));
};
const listProjects = () =>
    db.prepare("SELECT * FROM projects ORDER BY id DESC").all().map(rowToProject);
const getProject = (id) =>
    rowToProject(db.prepare("SELECT * FROM projects WHERE id = ?").get(id));
const deleteProject = (id) =>
    db.prepare("DELETE FROM projects WHERE id = ?").run(id).changes > 0;

// plans
const insertPlan = ({ projectId, slug, title, description = "", sortOrder = 0 }) => {
    const info = db.prepare(
        "INSERT INTO plans (project_id, slug, title, description, sort_order) VALUES (?, ?, ?, ?, ?)"
    ).run(projectId, slug, title, description, sortOrder);
    return rowToPlan(db.prepare("SELECT * FROM plans WHERE id = ?").get(info.lastInsertRowid));
};
const listPlansForProject = (projectId) =>
    db.prepare("SELECT * FROM plans WHERE project_id = ? ORDER BY sort_order, id").all(projectId).map(rowToPlan);
const getPlan = (id) =>
    rowToPlan(db.prepare("SELECT * FROM plans WHERE id = ?").get(id));

// tasks
const insertTask = ({ planId, attempt = 1 }) => {
    const info = db.prepare(
        "INSERT INTO tasks (plan_id, attempt) VALUES (?, ?)"
    ).run(planId, attempt);
    return rowToTask(db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid));
};
const updateTaskStatus = (id, status, opts = {}) => {
    const fields = ["status = ?"];
    const values = [status];
    if (status === "running") fields.push("started_at = datetime('now')");
    if (status === "done" || status === "failed") fields.push("finished_at = datetime('now')");
    if (opts.error !== undefined) { fields.push("error = ?"); values.push(opts.error || ""); }
    values.push(id);
    db.prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    return rowToTask(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id));
};
const listTasksForProject = (projectId) =>
    db.prepare(
        "SELECT t.* FROM tasks t JOIN plans p ON t.plan_id = p.id WHERE p.project_id = ? ORDER BY t.id"
    ).all(projectId).map(rowToTask);
const getLatestTaskForPlan = (planId) =>
    rowToTask(db.prepare("SELECT * FROM tasks WHERE plan_id = ? ORDER BY id DESC LIMIT 1").get(planId));
const getTask = (id) => rowToTask(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id));

// results
const insertResult = ({ taskId, html }) => {
    const info = db.prepare(
        "INSERT INTO results (task_id, html) VALUES (?, ?)"
    ).run(taskId, html);
    return rowToResult(db.prepare("SELECT * FROM results WHERE id = ?").get(info.lastInsertRowid));
};
const getLatestResultForPlan = (planId) =>
    rowToResult(db.prepare(`
        SELECT r.* FROM results r
        JOIN tasks t ON r.task_id = t.id
        WHERE t.plan_id = ? AND t.status = 'done'
        ORDER BY r.id DESC LIMIT 1
    `).get(planId));
const getResultByTaskId = (taskId) =>
    rowToResult(db.prepare("SELECT * FROM results WHERE task_id = ? ORDER BY id DESC LIMIT 1").get(taskId));

export {
    initDemoDatabase,
    insertProject, listProjects, getProject, deleteProject,
    insertPlan, listPlansForProject, getPlan,
    insertTask, updateTaskStatus, listTasksForProject, getLatestTaskForPlan, getTask,
    insertResult, getLatestResultForPlan, getResultByTaskId,
};
