// @ts-nocheck
const DEFAULT_SYSTEM_PROMPT = "你是 AIOS,运行在用户本地机器上的个人 AI 操作系统。";

const identity = (instruction = DEFAULT_SYSTEM_PROMPT) => {
  const text = String(instruction || "").trim() || DEFAULT_SYSTEM_PROMPT;
  return `# 身份\n${text}`;
};

export { DEFAULT_SYSTEM_PROMPT, identity };
