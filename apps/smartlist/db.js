import { db } from '../db/client.js';

export function initSmartlistDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS smartlist_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS smartlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      starred INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (list_id) REFERENCES smartlist_lists(id) ON DELETE CASCADE
    )
  `);
}

export function getLists() {
  return db.prepare(`
    SELECT l.*, COUNT(i.id) as item_count 
    FROM smartlist_lists l 
    LEFT JOIN smartlist_items i ON l.id = i.list_id 
    GROUP BY l.id 
    ORDER BY l.created_at DESC
  `).all();
}

export function getListDetail(id) {
  const list = db.prepare('SELECT * FROM smartlist_lists WHERE id = ?').get(id);
  if (!list) return null;
  const items = db.prepare('SELECT * FROM smartlist_items WHERE list_id = ? ORDER BY starred DESC, created_at DESC').all(id);
  return { ...list, items };
}

export function createList(topic, items) {
  const result = db.prepare('INSERT INTO smartlist_lists (topic) VALUES (?)').run(topic);
  const listId = result.lastInsertRowid;
  
  const insertItem = db.prepare('INSERT INTO smartlist_items (list_id, content) VALUES (?, ?)');
  for (const item of items) {
    insertItem.run(listId, item);
  }
  
  return listId;
}

export function toggleStar(itemId) {
  const item = db.prepare('SELECT starred FROM smartlist_items WHERE id = ?').get(itemId);
  if (!item) return;
  const newStarred = item.starred ? 0 : 1;
  db.prepare('UPDATE smartlist_items SET starred = ? WHERE id = ?').run(newStarred, itemId);
  return newStarred;
}

export function deleteList(id) {
  db.prepare('DELETE FROM smartlist_items WHERE list_id = ?').run(id);
  db.prepare('DELETE FROM smartlist_lists WHERE id = ?').run(id);
}

export function deleteItem(id) {
  db.prepare('DELETE FROM smartlist_items WHERE id = ?').run(id);
}
