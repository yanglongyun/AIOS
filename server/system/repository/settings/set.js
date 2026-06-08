// @ts-nocheck
import { getDb } from "../db.js";

const setSettingsRecord = (settings) => {
  const db = getDb();
  const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
  db.exec("BEGIN");
  try {
    for (const [key, value] of Object.entries(settings)) {
      stmt.run(key, JSON.stringify(value));
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};

export { setSettingsRecord };
