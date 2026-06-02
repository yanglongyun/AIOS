import { parseJson } from "../../../shared/json/parse.js";
import { db } from "./client.js";

const projectFields = `
  id, title, prompt, status, outline_json, notes,
  progress, video_path, error, created_at, updated_at
`;

const normalizeProject = (row) => row ? {
  id: row.id,
  title: row.title,
  prompt: row.prompt,
  status: row.status,
  outline: row.outline_json ? parseJson(row.outline_json, "longvideo.project.outline") : null,
  notes: row.notes,
  progress: row.progress ?? 0,
  videoPath: row.video_path || "",
  error: row.error || "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
} : null;

const normalizeSegment = (row) => ({
  id: row.id,
  projectId: row.project_id,
  index: row.segment_index,
  title: row.title,
  durationSec: row.duration_sec,
  narration: row.narration,
  imagePrompt: row.image_prompt,
  imageStatus: row.image_status,
  audioStatus: row.audio_status,
  imageUri: row.image_uri,
  imageLocal: row.image_local,
  audioLocal: row.audio_local,
  audioDuration: row.audio_duration,
  error: row.error,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const listSegments = (projectId) => db.prepare(`
  SELECT * FROM longvideo_segments
  WHERE project_id = ?
  ORDER BY segment_index ASC, id ASC
`).all(Number(projectId)).map(normalizeSegment);

const listProjects = () => db.prepare(`
  SELECT p.id, p.title, p.prompt, p.status, p.outline_json, p.notes,
         p.progress, p.video_path, p.error, p.created_at, p.updated_at,
         COUNT(s.id) AS segment_count
  FROM longvideo_projects p
  LEFT JOIN longvideo_segments s ON s.project_id = p.id
  GROUP BY p.id
  ORDER BY p.id DESC
`).all().map((row) => ({
  ...normalizeProject(row),
  segmentCount: row.segment_count,
}));

const getProject = (id) => {
  const project = normalizeProject(db.prepare(`
    SELECT ${projectFields} FROM longvideo_projects WHERE id = ?
  `).get(Number(id)));
  if (!project) return null;
  return { ...project, segments: listSegments(project.id) };
};

const getSegment = (id) => {
  const row = db.prepare("SELECT * FROM longvideo_segments WHERE id = ?").get(Number(id));
  return row ? normalizeSegment(row) : null;
};

const createProject = ({ title, prompt }) => {
  const info = db.prepare(`
    INSERT INTO longvideo_projects (title, prompt, status, created_at, updated_at)
    VALUES (?, ?, 'draft', datetime('now'), datetime('now'))
  `).run(
    String(title || "").trim() || String(prompt || "").trim().slice(0, 40) || "未命名视频",
    String(prompt || "").trim()
  );
  return getProject(info.lastInsertRowid);
};

const updateProjectPlan = ({ id, outline, segments }) => {
  const projectId = Number(id);
  db.exec("BEGIN");
  try {
    db.prepare(`
      UPDATE longvideo_projects
      SET outline_json = ?, status = 'planned', progress = 0, video_path = '', error = '',
          updated_at = datetime('now')
      WHERE id = ?
    `).run(JSON.stringify(outline), projectId);

    db.prepare("DELETE FROM longvideo_segments WHERE project_id = ?").run(projectId);
    const insert = db.prepare(`
      INSERT INTO longvideo_segments (
        project_id, segment_index, title, duration_sec, narration, image_prompt,
        image_status, audio_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'idle', 'idle', datetime('now'), datetime('now'))
    `);
    for (const segment of segments) {
      insert.run(
        projectId, segment.index, segment.title,
        segment.durationSec, segment.narration, segment.imagePrompt
      );
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return getProject(projectId);
};

const updateProject = ({ id, status, progress, videoPath, error }) => {
  const sets = [];
  const args = [];
  if (status !== undefined)    { sets.push("status = ?");     args.push(String(status)); }
  if (progress !== undefined)  { sets.push("progress = ?");   args.push(Math.max(0, Math.min(100, Math.round(progress)))); }
  if (videoPath !== undefined) { sets.push("video_path = ?"); args.push(String(videoPath || "")); }
  if (error !== undefined)     { sets.push("error = ?");      args.push(String(error || "")); }
  if (!sets.length) return getProject(id);
  sets.push("updated_at = datetime('now')");
  db.prepare(`UPDATE longvideo_projects SET ${sets.join(", ")} WHERE id = ?`).run(...args, Number(id));
  return getProject(id);
};

const updateSegmentImage = ({ segmentId, status, uri, local, error = "" }) => {
  const sets = ["image_status = ?", "error = ?", "updated_at = datetime('now')"];
  const args = [String(status || ""), String(error || "")];
  if (uri !== undefined)   { sets.push("image_uri = ?");   args.push(String(uri || "")); }
  if (local !== undefined) { sets.push("image_local = ?"); args.push(String(local || "")); }
  db.prepare(`UPDATE longvideo_segments SET ${sets.join(", ")} WHERE id = ?`).run(...args, Number(segmentId));
};

const updateSegmentAudio = ({ segmentId, status, local, duration, error = "" }) => {
  const sets = ["audio_status = ?", "error = ?", "updated_at = datetime('now')"];
  const args = [String(status || ""), String(error || "")];
  if (local !== undefined)    { sets.push("audio_local = ?");    args.push(String(local || "")); }
  if (duration !== undefined) { sets.push("audio_duration = ?"); args.push(Number(duration) || 0); }
  db.prepare(`UPDATE longvideo_segments SET ${sets.join(", ")} WHERE id = ?`).run(...args, Number(segmentId));
};

// 进程重启后内存队列丢失，把残留的 running/generating/rendering 复位，避免 UI 永久转圈。
const resetStuck = () => {
  db.exec(`
    UPDATE longvideo_segments SET image_status = 'error', error = '生成中断，请重试'
      WHERE image_status = 'running';
    UPDATE longvideo_segments SET audio_status = 'error', error = '生成中断，请重试'
      WHERE audio_status = 'running';
    UPDATE longvideo_projects SET status = 'error', error = '任务因服务重启中断，请重试'
      WHERE status IN ('generating', 'rendering');
  `);
};

export {
  createProject,
  getProject,
  getSegment,
  resetStuck,
  listProjects,
  listSegments,
  updateProject,
  updateProjectPlan,
  updateSegmentAudio,
  updateSegmentImage,
};
