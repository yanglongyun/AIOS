import { agentTask } from "../../app_shared/agentTask.js";

const generate = async ({ title, trace = [], locale = "en", currentContent = "" }) => {
  const lang = locale === "zh" ? "中文" : "English";
  const pathStr = trace.length ? `User arrived here via path: ${trace.join(" -> ")}` : "This is the starting root.";
  const contextSnippet = currentContent
    ? `\nThe user was just reading the following page before navigating here (use this as context, make the new page feel connected):\n---\n${currentContent.slice(0, 800)}\n---\n`
    : "";

  const prompt = `You are "Aether", an AI-powered text-mode browser and infinite wiki engine. The user has entered: "${title}"
Context: ${pathStr}${contextSnippet}

First, decide what kind of input "${title}" is, and respond accordingly:

**Case A — Website URL** (starts with http/https, or looks like a domain name like "github.com", "wikipedia.org", etc.):
  Simulate a text-mode browser (like Lynx) visiting that URL. Output a realistic text rendering of the site's main page in ${lang}:
  - Show a title header like: [PAGE TITLE] followed by the URL
  - Render main navigation links as [[Link Text]]
  - Show the main content as readable text with key terms as [[Concept]] links
  - Keep it realistic and informative, 150-300 words
  - End with a "LINKS ON THIS PAGE:" section listing 3-5 [[link]] items

**Case B — A topic, concept, person, place, or question** (anything meaningful and not a URL):
  Generate a comprehensive, fascinating wiki article about "${title}" in ${lang}.
  - Write in clear, structured Markdown paragraphs
  - Embed 3 to 6 [[Concept Name]] hyperlinks naturally inside the text
  - Keep it engaging, deep but readable (around 200-350 words)

**Case C — Garbled text, random characters, meaningless input, gibberish, or something that cannot be understood** (e.g. "asdfgh", "???!!!", "12345abc", random keyboard mashing):
  Output a fun retro 404 error page, styled as an old browser error. Write it in ${lang}. Include:
  - A bold "404 — Page Not Found" style header
  - A humorous explanation that the address could not be resolved
  - Suggest the user try a real topic
  - Mention the "Aether DNS service" couldn't locate this URL
  - Add 2-3 [[suggested topics]] as links for the user to try instead

**Case D — Sensitive, sexual, violent, hateful, or otherwise inappropriate content**:
  Output a formal "access blocked" notice page, styled as an official network filter notification. Write it in ${lang}. Include:
  - A header like: "🚫 为了守护您的身心健康，本页面访问已被限制" (or "🚫 Access Restricted for Your Wellbeing" in English)
  - A formal, official-sounding explanation (like a government or institution notice) stating that the content has been reviewed and restricted in accordance with platform guidelines
  - A fake official "Reference Code" like "REF-AETHER-418 · Content Classification: Restricted"
  - One or two polite sentences encouraging the user to explore other topics
  - Add 3 [[appropriate topic]] links as alternatives

Return ONLY the markdown content. Do NOT explain which case you chose.`;

  const result = await agentTask({ app: "wikitree", title: `Wiki: ${title}`, prompt });
  return { success: true, content: result.response || "Failed to generate content." };
};

export { generate };
