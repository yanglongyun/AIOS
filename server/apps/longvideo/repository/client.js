import { createAppDb } from "../../../shared/apps/db/createAppDb.js";

const db = createAppDb("longvideo.db");
const nowIso = () => new Date().toISOString();

export {
  db,
  nowIso,
};
