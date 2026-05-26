import { createAppDb } from "../../_shared/db/createAppDb.js";

const db = createAppDb("demogen.db");
const nowIso = () => new Date().toISOString();

export { db, nowIso };
