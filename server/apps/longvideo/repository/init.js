import { db } from "./client.js";

const initDatabase = () => {
  db.exec(`CREATE TABLE IF NOT EXISTS longvideo_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT '',
    topic TEXT NOT NULL DEFAULT '',
    audience TEXT NOT NULL DEFAULT '',
    style TEXT NOT NULL DEFAULT '',
    duration_min INTEGER NOT NULL DEFAULT 60,
    status TEXT NOT NULL DEFAULT 'draft',
    outline_json TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS longvideo_segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    segment_index INTEGER NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    duration_sec INTEGER NOT NULL DEFAULT 0,
    narration TEXT NOT NULL DEFAULT '',
    image_prompt TEXT NOT NULL DEFAULT '',
    image_status TEXT NOT NULL DEFAULT 'draft',
    audio_status TEXT NOT NULL DEFAULT 'draft',
    video_status TEXT NOT NULL DEFAULT 'draft',
    image_uri TEXT NOT NULL DEFAULT '',
    audio_uri TEXT NOT NULL DEFAULT '',
    video_uri TEXT NOT NULL DEFAULT '',
    error TEXT NOT NULL DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(project_id) REFERENCES longvideo_projects(id) ON DELETE CASCADE
  )`);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_longvideo_segments_project
    ON longvideo_segments(project_id, segment_index)`);

  db.exec(`CREATE TABLE IF NOT EXISTS longvideo_provider_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now'))
  )`);
};

export {
  initDatabase,
};
