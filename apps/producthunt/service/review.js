import { agentTask } from "../../app_shared/agentTask.js";

const review = async ({ products, locale = "en" }) => {
  const lang = locale === "zh" ? "中文" : "English";
  const list = (products || []).slice(0, 10).map((p, i) =>
    `${i + 1}. ${p.name} (${p.votes} votes) - ${p.tagline}`
  ).join("\n");

  const prompt = `Review today's top Product Hunt launches in ${lang}. For each notable product, give a one-line comment on why it's interesting or who it's for. Then a 2-sentence overall trend summary. Be opinionated and concise.

${list}

Return only the review, nothing else.`;

  const result = await agentTask({ app: "producthunt", title: "PH Daily Review", prompt });
  return { success: true, review: result.response || "" };
};

export { review };
