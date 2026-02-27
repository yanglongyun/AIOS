import { db } from '../db/client.js';

export function initOutlineDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS outline_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER,
      topic TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES outline_nodes(id) ON DELETE CASCADE
    )
  `);
}

export function getNodes() {
  return db.prepare('SELECT * FROM outline_nodes ORDER BY id ASC').all();
}

export function createNode(parentId, topic) {
  if (parentId === null) {
    return db.prepare('INSERT INTO outline_nodes (parent_id, topic) VALUES (NULL, ?)').run(topic);
  }
  return db.prepare('INSERT INTO outline_nodes (parent_id, topic) VALUES (?, ?)').run(parentId, topic);
}

export function updateNode(id, topic) {
  return db.prepare('UPDATE outline_nodes SET topic = ? WHERE id = ?').run(topic, id);
}

export function deleteNode(id) {
  return db.prepare('DELETE FROM outline_nodes WHERE id = ?').run(id);
}

export function getRootNodes() {
  return db.prepare('SELECT * FROM outline_nodes WHERE parent_id IS NULL ORDER BY id ASC').all();
}

export function getChildNodes(parentId) {
  return db.prepare('SELECT * FROM outline_nodes WHERE parent_id = ? ORDER BY id ASC').all(parentId);
}
