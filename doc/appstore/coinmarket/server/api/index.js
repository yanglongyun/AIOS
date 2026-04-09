import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { list } from "../service/list.js";
import { detail } from "../service/detail.js";
import { analyze } from "../service/analyze.js";
import { saveAnalysis, listAnalysesByCoin } from "../repository/analysis.js";

const handleCoinmarketApi = async (req, res, path) => {
  if (path === "/apps/coinmarket/list" && req.method === "GET") {
    const data = await list();
    return json(res, data);
  }
  if (path === "/apps/coinmarket/detail" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get("id") || "";
    const data = await detail({ id });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }
  if (path === "/apps/coinmarket/analyze" && req.method === "POST") {
    const body = await readBody(req);
    const data = await analyze(body);
    return json(res, data);
  }
  if (path === "/apps/coinmarket/coin-analyze" && req.method === "POST") {
    const body = await readBody(req);
    const coin = body.coin;
    if (!coin?.id) return json(res, { success: false, message: "coin is required" }, 400);
    const data = await analyze({ coins: [coin], locale: body.locale });
    if (data.analysis) {
      saveAnalysis({
        coinId: coin.id, coinName: coin.name, coinSymbol: coin.symbol,
        coinImage: coin.image, price: coin.price, analysis: data.analysis
      });
    }
    return json(res, data);
  }
  if (path === "/apps/coinmarket/coin-history" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const coinId = url.searchParams.get("coinId") || "";
    if (!coinId) return json(res, { success: false, message: "coinId is required" }, 400);
    return json(res, { success: true, analyses: listAnalysesByCoin(coinId) });
  }
  return false;
};

export { handleCoinmarketApi };
