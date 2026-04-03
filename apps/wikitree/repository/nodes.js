import { db } from "./client.js";

const saveNode = ({ id, parentId, title, content }) => {
  db.prepare(`
    INSERT OR REPLACE INTO wt_nodes (id, parent_id, title, content)
    VALUES (?, ?, ?, ?)
  `).run(id, parentId || "", title, content);
};

const getNode = (id) => {
  return db.prepare("SELECT * FROM wt_nodes WHERE id = ?").get(id);
};

const listNodes = () => {
    return db.prepare("SELECT id, parent_id, title, created_at FROM wt_nodes ORDER BY created_at ASC").all();
};

export { saveNode, getNode, listNodes };
