import { agentTask } from "../../app_shared/agentTask.js";

const analyze = async ({ quakes, locale = "en" }) => {
  const lang = locale === "zh" ? "中文" : "English";
  const summary = (quakes || []).slice(0, 20).map((q) =>
    `M${q.mag} - ${q.place} (depth ${q.depth}km, ${new Date(q.time).toISOString().slice(0, 16)})`
  ).join('\n');

  const prompt = `Analyze recent global earthquake activity based on this data, in ${lang}. Identify patterns: active regions, magnitude trends, any notable events. Give 3-5 concise observations.

${summary}

Return only the analysis, nothing else.`;

  const result = await agentTask({ app: "earthquake", title: "Seismic Analysis", prompt });
  return { success: true, analysis: result.response || "" };
};

export { analyze };
