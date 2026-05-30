import { db, nowIso } from "./client.js";

function listWorks(projectId) {
  return db.prepare(`
    SELECT * FROM demogen_works WHERE project_id = ? ORDER BY id ASC
  `).all(projectId).map(deserialize);
}

function getWork(id) {
  const row = db.prepare(`SELECT * FROM demogen_works WHERE id = ?`).get(id);
  return row ? deserialize(row) : null;
}

function createWork({ project_id, plan_id, name, angle, highlights, batch }) {
  const now = nowIso();
  const result = db.prepare(`
    INSERT INTO demogen_works
      (project_id, plan_id, name, angle, highlights, batch, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'idle', ?, ?)
  `).run(
    Number(project_id),
    String(plan_id || ""),
    String(name || "").trim(),
    String(angle || "").trim(),
    JSON.stringify(Array.isArray(highlights) ? highlights : []),
    String(batch || ""),
    now, now
  );
  return getWork(result.lastInsertRowid);
}

function updateWork(id, fields) {
  const allowed = ["task_id", "batch", "status", "dir_path", "entry_path", "error", "name", "angle"];
  const keys = Object.keys(fields).filter((k) => allowed.includes(k));
  if (!keys.length) return getWork(id);
  const sets = keys.map((k) => `${k} = ?`);
  sets.push("updated_at = ?");
  const vals = keys.map((k) => fields[k]);
  vals.push(nowIso(), id);
  db.prepare(`UPDATE demogen_works SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  return getWork(id);
}

function deleteWork(id) {
  db.prepare(`DELETE FROM demogen_works WHERE id = ?`).run(id);
}

function clearProjectWorks(projectId) {
  db.prepare(`DELETE FROM demogen_works WHERE project_id = ?`).run(projectId);
}

function deserialize(row) {
  return { ...row, highlights: safeParseArray(row.highlights) };
}

function safeParseArray(val) {
  try {
    const parsed = JSON.parse(val || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export { listWorks, getWork, createWork, updateWork, deleteWork, clearProjectWorks };
