import { db } from "./client.js";

const addFavorite = ({ id, nodeId, title }) => {
  db.prepare(`INSERT OR REPLACE INTO wt_favorites (id, node_id, title) VALUES (?, ?, ?)`).run(id, nodeId, title);
};

const removeFavorite = (id) => {
  db.prepare(`DELETE FROM wt_favorites WHERE id = ?`).run(id);
};

const listFavorites = () => {
  return db.prepare(`SELECT * FROM wt_favorites ORDER BY created_at DESC`).all();
};

const isFavorited = (nodeId) => {
  return !!db.prepare(`SELECT id FROM wt_favorites WHERE node_id = ?`).get(nodeId);
};

export { addFavorite, removeFavorite, listFavorites, isFavorited };
