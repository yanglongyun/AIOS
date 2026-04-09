import { agentTask } from "../../app_shared/agentTask.js";

const analyze = async ({ repo, locale = "en" }) => {
  const lang = locale === "zh" ? "中文" : "English";
  const prompt = `Analyze this trending GitHub project in ${lang}. Explain what it does, why it's popular, who should use it, and notable technical highlights. Be concise (4-6 sentences).

Repository: ${repo.name}
Description: ${repo.description}
Language: ${repo.language}
Stars: ${repo.stars}
URL: ${repo.url}

Return only the analysis, nothing else.`;

  const result = await agentTask({ app: "ghtrending", title: `Analyze: ${repo.name}`, prompt });
  return { success: true, analysis: result.response || "" };
};

export { analyze };
