import { db, nowIso } from "./client.js";

const DEFAULT_STACK = "单文件 HTML（内联 CSS/JS，浏览器直接打开）";

function listProjects() {
  return db.prepare(`
    SELECT
      p.*,
      (SELECT COUNT(*) FROM demogen_works w WHERE w.project_id = p.id) AS work_count,
      (SELECT COUNT(*) FROM demogen_works w WHERE w.project_id = p.id AND w.status = 'done') AS done_count,
      (SELECT COUNT(*) FROM demogen_works w WHERE w.project_id = p.id AND w.status = 'running') AS running_count
    FROM demogen_projects p
    ORDER BY p.id DESC
  `).all();
}

function getProject(id) {
  return db.prepare(`SELECT * FROM demogen_projects WHERE id = ?`).get(id) ?? null;
}

function createProject({ title, feature, stack, constraints, plan_count = 4 }) {
  const now = nowIso();
  const result = db.prepare(`
    INSERT INTO demogen_projects (title, feature, stack, constraints, plan_count, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)
  `).run(
    String(title || feature || "新项目").trim().slice(0, 120),
    String(feature || "").trim(),
    String(stack || "").trim() || DEFAULT_STACK,
    String(constraints || "").trim(),
    Math.max(1, Math.min(10, Number(plan_count) || 4)),
    now, now
  );
  return getProject(result.lastInsertRowid);
}

function updateProject(id, fields) {
  const allowed = ["title", "feature", "stack", "constraints", "plan_count", "status"];
  const sets = Object.keys(fields)
    .filter(k => allowed.includes(k))
    .map(k => `${k} = ?`);
  if (!sets.length) return getProject(id);
  sets.push("updated_at = ?");
  const vals = Object.keys(fields)
    .filter(k => allowed.includes(k))
    .map(k => fields[k]);
  vals.push(nowIso(), id);
  db.prepare(`UPDATE demogen_projects SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  return getProject(id);
}

function deleteProject(id) {
  db.prepare(`DELETE FROM demogen_projects WHERE id = ?`).run(id);
}

export { listProjects, getProject, createProject, updateProject, deleteProject };
