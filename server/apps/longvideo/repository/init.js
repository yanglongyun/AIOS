import { db } from "./client.js";

const initDatabase = () => {
  // 旧表结构粗糙（远端 URL 当素材、无真实时长、无进度/成片路径），整体重建。
  db.exec(`
    DROP TABLE IF EXISTS longvideo_segments;
    DROP TABLE IF EXISTS longvideo_projects;

    CREATE TABLE longvideo_projects (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL DEFAULT '',
      prompt      TEXT    NOT NULL DEFAULT '',
      status      TEXT    NOT NULL DEFAULT 'draft',
      outline_json TEXT   NOT NULL DEFAULT '',
      notes       TEXT    NOT NULL DEFAULT '',
      progress    INTEGER NOT NULL DEFAULT 0,
      video_path  TEXT    NOT NULL DEFAULT '',
      error       TEXT    NOT NULL DEFAULT '',
      created_at  TEXT    DEFAULT (datetime('now')),
      updated_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE longvideo_segments (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id    INTEGER NOT NULL REFERENCES longvideo_projects(id) ON DELETE CASCADE,
      segment_index INTEGER NOT NULL,
      title         TEXT    NOT NULL DEFAULT '',
      duration_sec  INTEGER NOT NULL DEFAULT 0,
      narration     TEXT    NOT NULL DEFAULT '',
      image_prompt  TEXT    NOT NULL DEFAULT '',
      image_status  TEXT    NOT NULL DEFAULT 'idle',
      audio_status  TEXT    NOT NULL DEFAULT 'idle',
      image_uri     TEXT    NOT NULL DEFAULT '',
      image_local   TEXT    NOT NULL DEFAULT '',
      audio_local   TEXT    NOT NULL DEFAULT '',
      audio_duration REAL   NOT NULL DEFAULT 0,
      error         TEXT    NOT NULL DEFAULT '',
      created_at    TEXT    DEFAULT (datetime('now')),
      updated_at    TEXT    DEFAULT (datetime('now'))
    );

    CREATE INDEX idx_longvideo_segments_project
      ON longvideo_segments(project_id, segment_index ASC);

    CREATE TABLE IF NOT EXISTS longvideo_provider_settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
};

export {
  initDatabase,
};
