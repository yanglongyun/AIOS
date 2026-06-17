// @ts-nocheck
import { getDb } from "../db.js";

const getTask = (id) => getDb().prepare("SELECT * FROM tasks WHERE id = ?").get(Number(id)) || null;

export { getTask };
