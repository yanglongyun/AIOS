// @ts-nocheck
import { getDb } from "../db.js";

const getSetting = (key, fallback = "") => {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(String(key || ""));
  return row ? row.value : fallback;
};

const setSetting = (key, value) => {
  getDb()
    .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
    .run(String(key || ""), String(value ?? ""));
};

const getSettings = () => {
  const rows = getDb().prepare("SELECT key, value FROM settings").all();
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
};

const setSettings = (settings = {}) => {
  for (const [key, value] of Object.entries(settings)) {
    setSetting(key, value);
  }
};

const deleteSettings = (keys = []) => {
  const stmt = getDb().prepare("DELETE FROM settings WHERE key = ?");
  for (const key of keys) stmt.run(String(key || ""));
};

export { deleteSettings, getSetting, getSettings, setSetting, setSettings };
