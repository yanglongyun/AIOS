import { agentTask } from "../../app_shared/agentTask.js";

const analyzeSingleCoin = async ({ coin, locale = "en" }) => {
  const lang = locale === "zh" ? "中文" : "English";
  const prompt = `Analyze this cryptocurrency in ${lang}. Focus on what it is, recent price behavior, risk/reward, and what kind of user should pay attention to it. Be concise but useful. Use 4 short sections with clear labels.

Name: ${coin.name}
Symbol: ${coin.symbol}
Price: $${coin.price}
24h change: ${coin.change24h > 0 ? "+" : ""}${(coin.change24h || 0).toFixed(2)}%
7d change: ${coin.change7d > 0 ? "+" : ""}${(coin.change7d || 0).toFixed(2)}%
Market cap: $${coin.marketCap || 0}
24h high: $${coin.high24h || 0}
24h low: $${coin.low24h || 0}
ATH: $${coin.ath || 0}
Description: ${coin.description || "(none)"}

Return only the analysis, nothing else.`;

  const result = await agentTask({ app: "coinmarket", title: `Coin Analysis: ${coin.name}`, prompt });
  return { success: true, analysis: result.response || "" };
};

const analyzeMarket = async ({ coins, locale = "en" }) => {
  const lang = locale === "zh" ? "中文" : "English";
  const top10 = (coins || []).slice(0, 10).map((c) =>
    `${c.name} (${c.symbol}): $${c.price}, 24h ${c.change24h > 0 ? '+' : ''}${(c.change24h || 0).toFixed(1)}%, 7d ${c.change7d > 0 ? '+' : ''}${(c.change7d || 0).toFixed(1)}%`
  ).join('\n');

  const prompt = `Analyze the current crypto market based on this data, in ${lang}. Give 3-5 key observations about trends, notable movers, and market sentiment. Be concise.

${top10}

Return only the analysis, nothing else.`;

  const result = await agentTask({ app: "coinmarket", title: "Market Analysis", prompt });
  return { success: true, analysis: result.response || "" };
};

const analyze = async ({ coins, coin, locale = "en" }) => {
  if (coin?.id) return analyzeSingleCoin({ coin, locale });
  return analyzeMarket({ coins, locale });
};

export { analyze };
