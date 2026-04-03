import { agentTask } from "../../app_shared/agentTask.js";

const translate = async ({ title, text, locale = "en" }) => {
  const direction = locale === "zh" ? "English → Chinese" : "Chinese → English";
  const prompt = `Translate the following content (${direction}). Format as bilingual: show original paragraph, then the translation below it, separated by a blank line. Keep it readable.

Title: ${title}
Content: ${text || title}

Return only the bilingual translation, nothing else.`;

  const result = await agentTask({ app: "hackernews", title: `Translate: ${title}`, prompt });
  return { success: true, translation: result.response || "" };
};

export { translate };
