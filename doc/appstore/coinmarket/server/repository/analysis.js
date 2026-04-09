import { db } from "./client.js";

const saveAnalysis = ({ coinId, coinName, coinSymbol, coinImage, price, analysis }) => {
  db.prepare(`
    INSERT INTO coin_analyses (coin_id, coin_name, coin_symbol, coin_image, price, analysis)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(coinId, coinName, coinSymbol || '', coinImage || '', price || 0, analysis);
};

const listAnalysesByCoin = (coinId) => {
  return db.prepare("SELECT * FROM coin_analyses WHERE coin_id = ? ORDER BY created_at DESC LIMIT 20").all(coinId);
};

export { saveAnalysis, listAnalysesByCoin };
