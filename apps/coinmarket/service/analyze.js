import { agentTask } from "../../app_shared/agentTask.js";

const analyze = async ({ coins, locale = "en" }) => {
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

export { analyze };
