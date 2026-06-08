// @ts-nocheck
const providerGroups = [
  { id: "default", name: "默认" },
  { id: "aggregator", name: "聚合平台" },
  { id: "coding", name: "Coding Plan" },
  { id: "custom", name: "自定义" },
];

const providers = [
  {
    id: "openai",
    name: "OpenAI",
    group: "default",
    apiUrl: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-5.2",
    models: ["gpt-5.2", "gpt-5.1", "gpt-5", "gpt-4.1", "gpt-4o", "o3", "o4-mini"],
  },
  {
    id: "claude",
    name: "Claude",
    group: "default",
    apiUrl: "https://api.anthropic.com/v1/messages",
    defaultModel: "claude-sonnet-4-6",
    models: ["claude-sonnet-4-6", "claude-opus-4-5", "claude-haiku-4-5"],
  },
  {
    id: "gemini",
    name: "Gemini",
    group: "default",
    apiUrl: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    defaultModel: "gemini-3-flash-preview",
    models: ["gemini-3-flash-preview", "gemini-3-pro-preview", "gemini-2.5-pro", "gemini-2.5-flash"],
  },
  {
    id: "mistral",
    name: "Mistral",
    group: "default",
    apiUrl: "https://api.mistral.ai/v1/chat/completions",
    defaultModel: "mistral-large-latest",
    models: ["mistral-large-latest", "mistral-medium-latest", "codestral-latest"],
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    group: "default",
    apiUrl: "https://api.x.ai/v1/chat/completions",
    defaultModel: "grok-4-1-fast-reasoning",
    models: ["grok-4-1-fast-reasoning", "grok-4-1", "grok-4", "grok-3"],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    group: "default",
    apiUrl: "https://api.deepseek.com/chat/completions",
    defaultModel: "deepseek-v4-flash",
    models: ["deepseek-v4-flash", "deepseek-v4-pro"],
  },
  {
    id: "qwen",
    name: "Qwen (通义千问)",
    group: "default",
    apiUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    defaultModel: "qwen3.5-plus",
    models: ["qwen3.5-plus", "qwen3.5-max", "qwen3.5-coder-plus", "qwen3-coder-plus", "qwen-plus"],
  },
  {
    id: "glm",
    name: "GLM (智谱)",
    group: "default",
    apiUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    defaultModel: "glm-5",
    models: ["glm-5", "glm-5-air", "glm-4.5", "glm-4.5-air"],
  },
  {
    id: "kimi",
    name: "Kimi (月之暗面)",
    group: "default",
    apiUrl: "https://api.moonshot.cn/v1/chat/completions",
    defaultModel: "kimi-k2.5",
    models: ["kimi-k2.5", "kimi-k2", "moonshot-v1-128k", "moonshot-v1-32k", "moonshot-v1-8k"],
  },
  {
    id: "stepfun",
    name: "StepFun (阶跃星辰)",
    group: "default",
    apiUrl: "https://api.stepfun.com/v1/chat/completions",
    defaultModel: "step-3.5-flash",
    models: ["step-3.5-flash", "step-3.5", "step-2-mini"],
  },
  {
    id: "minimax",
    name: "MiniMax",
    group: "default",
    apiUrl: "https://api.minimaxi.com/v1/chat/completions",
    defaultModel: "MiniMax-M2.5",
    models: ["MiniMax-M2.5", "MiniMax-Text-01"],
  },
  {
    id: "doubao",
    name: "Doubao (豆包)",
    group: "default",
    apiUrl: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    defaultModel: "doubao-seed-2-0-pro-260215",
    models: ["doubao-seed-2-0-pro-260215", "doubao-seed-2-0-flash", "doubao-seed-1-6"],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    group: "aggregator",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    defaultModel: "google/gemini-3-flash-preview",
    models: [
      "google/gemini-3-flash-preview",
      "google/gemini-2.5-pro",
      "anthropic/claude-sonnet-4.6",
      "openai/gpt-5.2",
      "deepseek/deepseek-chat",
      "moonshotai/kimi-k2.5",
    ],
  },
  {
    id: "together",
    name: "Together AI",
    group: "aggregator",
    apiUrl: "https://api.together.xyz/v1/chat/completions",
    defaultModel: "moonshotai/Kimi-K2.5",
    models: ["moonshotai/Kimi-K2.5", "deepseek-ai/DeepSeek-V3", "Qwen/Qwen3-Coder"],
  },
  {
    id: "fireworks",
    name: "Fireworks AI",
    group: "aggregator",
    apiUrl: "https://api.fireworks.ai/inference/v1/chat/completions",
    defaultModel: "glm-5",
    models: ["glm-5", "qwen3-coder-plus", "deepseek-v3"],
  },
  {
    id: "glm-coding",
    name: "智谱 Coding Plan",
    group: "coding",
    apiUrl: "https://open.bigmodel.cn/api/coding/paas/v4/chat/completions",
    defaultModel: "glm-5",
    models: ["glm-5"],
  },
  {
    id: "aliyun-coding",
    name: "阿里云 Coding Plan",
    group: "coding",
    apiUrl: "https://coding.dashscope.aliyuncs.com/v1/chat/completions",
    defaultModel: "qwen3-coder-plus",
    models: ["qwen3-coder-plus", "qwen3.5-coder-plus"],
  },
  {
    id: "ark-coding",
    name: "火山引擎 Coding Plan",
    group: "coding",
    apiUrl: "https://ark.cn-beijing.volces.com/api/coding/v3/chat/completions",
    defaultModel: "doubao-seed-2.0-pro",
    models: ["doubao-seed-2.0-pro"],
  },
  {
    id: "tencent-coding",
    name: "腾讯云 Coding Plan",
    group: "coding",
    apiUrl: "https://api.lkeap.cloud.tencent.com/coding/v3/chat/completions",
    defaultModel: "minimax-m2.5",
    models: ["minimax-m2.5"],
  },
  {
    id: "kimi-coding",
    name: "Kimi Coding Plan",
    group: "coding",
    apiUrl: "https://api.kimi.com/coding/v1/chat/completions",
    defaultModel: "kimi-for-coding",
    models: ["kimi-for-coding"],
  },
  {
    id: "custom",
    name: "自定义",
    group: "custom",
    apiUrl: "",
    defaultModel: "",
    models: [],
  },
];

const cloneProvider = (provider) => ({
  ...provider,
  models: [...(provider.models || [])],
});

const listLlmProviderGroups = () => providerGroups.map((group) => ({ ...group }));

const listLlmProviders = () => providers.map(cloneProvider);

const getLlmProvider = (id) => {
  const provider = providers.find((item) => item.id === id);
  return provider ? cloneProvider(provider) : null;
};

export {
  getLlmProvider,
  listLlmProviderGroups,
  listLlmProviders,
};
