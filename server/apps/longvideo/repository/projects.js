import { parseJson } from "../../../shared/json/parse.js";
import { db } from "./client.js";

const projectFields = `
  id, title, prompt, status,
  outline_json, notes, created_at, updated_at
`;

const normalizeProject = (row) => row ? {
  id: row.id,
  title: row.title,
  prompt: row.prompt,
  status: row.status,
  outline: row.outline_json ? parseJson(row.outline_json, "longvideo.project.outline") : null,
  notes: row.notes,
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
  videoStatus: row.video_status,
  imageUri: row.image_uri,
  audioUri: row.audio_uri,
  videoUri: row.video_uri,
  error: row.error,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const listProjects = () => db.prepare(`
  SELECT p.id, p.title, p.prompt, p.status,
         p.outline_json, p.notes, p.created_at, p.updated_at,
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
    SELECT ${projectFields}
    FROM longvideo_projects
    WHERE id = ?
  `).get(Number(id)));
  if (!project) return null;
  const segments = db.prepare(`
    SELECT *
    FROM longvideo_segments
    WHERE project_id = ?
    ORDER BY segment_index ASC, id ASC
  `).all(project.id).map(normalizeSegment);
  return { ...project, segments };
};

const createProject = ({ title, prompt }) => {
  const info = db.prepare(`
    INSERT INTO longvideo_projects (title, prompt, status, created_at, updated_at)
    VALUES (?, ?, 'draft', datetime('now'), datetime('now'))
  `).run(
    String(title || "").trim() || String(prompt || "").trim() || "未命名视频",
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
      SET outline_json = ?, status = 'planned', updated_at = datetime('now')
      WHERE id = ?
    `).run(JSON.stringify(outline), projectId);

    db.prepare("DELETE FROM longvideo_segments WHERE project_id = ?").run(projectId);
    const insert = db.prepare(`
      INSERT INTO longvideo_segments (
        project_id, segment_index, title, duration_sec, narration, image_prompt,
        image_status, audio_status, video_status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'draft', 'draft', 'draft', datetime('now'), datetime('now'))
    `);
    for (const segment of segments) {
      insert.run(
        projectId,
        segment.index,
        segment.title,
        segment.durationSec,
        segment.narration,
        segment.imagePrompt
      );
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return getProject(projectId);
};

const updateAssetStatuses = ({ projectId, imageStatus, audioStatus, videoStatus, error }) => {
  db.prepare(`
    UPDATE longvideo_segments
    SET image_status = ?, audio_status = ?, video_status = ?, error = ?, updated_at = datetime('now')
    WHERE project_id = ?
  `).run(imageStatus, audioStatus, videoStatus, String(error || ""), Number(projectId));

  db.prepare(`
    UPDATE longvideo_projects
    SET status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(error ? "blocked" : "asset_queue", Number(projectId));

  return getProject(projectId);
};

const updateSegmentImage = ({ segmentId, status, uri = "", error = "" }) => {
  db.prepare(`
    UPDATE longvideo_segments
    SET image_status = ?, image_uri = ?, error = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(String(status || ""), String(uri || ""), String(error || ""), Number(segmentId));
};

const updateSegmentAudio = ({ segmentId, status, uri = "", error = "" }) => {
  db.prepare(`
    UPDATE longvideo_segments
    SET audio_status = ?, audio_uri = ?, error = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(String(status || ""), String(uri || ""), String(error || ""), Number(segmentId));
};

export {
  createProject,
  getProject,
  listProjects,
  updateAssetStatuses,
  updateProjectPlan,
  updateSegmentAudio,
  updateSegmentImage,
};
