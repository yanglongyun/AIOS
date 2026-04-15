const SUMMARY_BLOCK_RE = /(?:\r?\n)?<<<summary\r?\n([\s\S]+?)\r?\n>>>\s*$/i;

const parseAssistantSummary = (content = "") => {
  const raw = String(content || "").trimEnd();
  const match = raw.match(SUMMARY_BLOCK_RE);
  if (!match) {
    return { content: raw, summary: "" };
  }
  let summary = "";
  try {
    const parsed = JSON.parse(String(match[1] || "").trim());
    summary = String(parsed?.text || "").replace(/\s+/g, " ").trim();
  } catch {
    summary = "";
  }
  const cleaned = raw.slice(0, match.index).trimEnd();
  return {
    content: cleaned || raw,
    summary
  };
};

export {
  parseAssistantSummary
};
