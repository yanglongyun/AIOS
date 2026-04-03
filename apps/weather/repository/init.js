import { db } from "./client.js";
const initWeatherDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS weather_cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT '',
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
};
export { initWeatherDatabase };
