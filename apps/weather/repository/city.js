import { db } from "./client.js";

const addCity = ({ name, country, lat, lon }) => {
  const existing = db.prepare("SELECT id FROM weather_cities WHERE lat = ? AND lon = ?").get(lat, lon);
  if (existing) return existing;
  const ret = db.prepare(
    "INSERT INTO weather_cities (name, country, lat, lon) VALUES (?, ?, ?, ?)"
  ).run(name, country || '', lat, lon);
  return db.prepare("SELECT * FROM weather_cities WHERE id = ?").get(ret.lastInsertRowid);
};

const removeCity = (id) => {
  db.prepare("DELETE FROM weather_cities WHERE id = ?").run(id);
};

const listCities = () => {
  return db.prepare("SELECT * FROM weather_cities ORDER BY created_at DESC").all();
};

export { addCity, removeCity, listCities };
