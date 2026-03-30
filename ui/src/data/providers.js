const PROVIDER_GROUPS = [
  { id: "default", name: "\u9ED8\u8BA4" },
  { id: "aggregator", name: "\u805A\u5408\u5E73\u53F0" },
  { id: "coding", name: "Coding Plan" },
  { id: "custom", name: "\u81EA\u5B9A\u4E49" }
];
const PROVIDERS = [
  // 默认
  {
    id: "openai",
    name: "OpenAI",
    group: "default",
    apiUrl: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-5.4"
  },
  {
    id: "claude",
    name: "Claude",
    group: "default",
    apiUrl: "https://api.anthropic.com/v1/chat/completions",
    defaultModel: "claude-sonnet-4-6"
  },
  {
    id: "gemini",
    name: "Gemini",
    group: "default",
    apiUrl: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    defaultModel: "gemini-3-flash-preview"
  },
  {
    id: "mistral",
    name: "Mistral",
    group: "default",
    apiUrl: "https://api.mistral.ai/v1/chat/completions",
    defaultModel: "mistral-large-latest"
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    group: "default",
    apiUrl: "https://api.x.ai/v1/chat/completions",
    defaultModel: "grok-4-1-fast-reasoning"
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    group: "default",
    apiUrl: "https://api.deepseek.com/chat/completions",
    defaultModel: "deepseek-chat"
  },
  {
    id: "qwen",
    name: "Qwen (\u901A\u4E49\u5343\u95EE)",
    group: "default",
    apiUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    defaultModel: "qwen3.5-plus"
  },
  {
    id: "glm",
    name: "GLM (\u667A\u8C31)",
    group: "default",
    apiUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    defaultModel: "glm-5"
  },
  {
    id: "zai",
    name: "z.ai",
    group: "default",
    apiUrl: "https://api.z.ai/api/paas/v4/chat/completions",
    defaultModel: "glm-5"
  },
  {
    id: "kimi",
    name: "Kimi (\u6708\u4E4B\u6697\u9762)",
    group: "default",
    apiUrl: "https://api.moonshot.cn/v1/chat/completions",
    defaultModel: "kimi-k2.5"
  },
  {
    id: "stepfun",
    name: "StepFun (\u9636\u8DC3\u661F\u8FB0)",
    group: "default",
    apiUrl: "https://api.stepfun.com/v1/chat/completions",
    defaultModel: "step-3.5-flash"
  },
  {
    id: "minimax",
    name: "MiniMax",
    group: "default",
    apiUrl: "https://api.minimaxi.com/v1/chat/completions",
    defaultModel: "MiniMax-M2.5"
  },
  {
    id: "doubao",
    name: "Doubao (\u8C46\u5305)",
    group: "default",
    apiUrl: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    defaultModel: "doubao-seed-2-0-pro-260215"
  },
  // 聚合平台
  {
    id: "openrouter",
    name: "OpenRouter",
    group: "aggregator",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    defaultModel: "google/gemini-3-flash-preview"
  },
  {
    id: "together",
    name: "Together AI",
    group: "aggregator",
    apiUrl: "https://api.together.xyz/v1/chat/completions",
    defaultModel: "moonshotai/Kimi-K2.5"
  },
  {
    id: "fireworks",
    name: "Fireworks AI",
    group: "aggregator",
    apiUrl: "https://api.fireworks.ai/inference/v1/chat/completions",
    defaultModel: "glm-5"
  },
  {
    id: "chatnext",
    name: "ChatNext",
    group: "aggregator",
    apiUrl: "https://api.chatnext.ai/v1/chat/completions",
    defaultModel: "gpt-5-mini"
  },
  // Coding Plan
  {
    id: "glm-coding",
    name: "\u667A\u8C31 Coding Plan",
    group: "coding",
    apiUrl: "https://open.bigmodel.cn/api/coding/paas/v4/chat/completions",
    defaultModel: "glm-5"
  },
  {
    id: "aliyun-coding",
    name: "\u963F\u91CC\u4E91 Coding Plan",
    group: "coding",
    apiUrl: "https://coding.dashscope.aliyuncs.com/v1/chat/completions",
    defaultModel: "qwen3-coder-plus"
  },
  {
    id: "ark-coding",
    name: "\u706B\u5C71\u5F15\u64CE Coding Plan",
    group: "coding",
    apiUrl: "https://ark.cn-beijing.volces.com/api/coding/v3/chat/completions",
    defaultModel: "doubao-seed-2.0-pro"
  },
  {
    id: "tencent-coding",
    name: "\u817E\u8BAF\u4E91 Coding Plan",
    group: "coding",
    apiUrl: "https://api.lkeap.cloud.tencent.com/coding/v3/chat/completions",
    defaultModel: "minimax-m2.5"
  },
  {
    id: "jdcloud-coding",
    name: "\u4EAC\u4E1C\u4E91 Coding Plan",
    group: "coding",
    apiUrl: "https://modelservice.jdcloud.com/coding/openai/v1/chat/completions",
    defaultModel: "Kimi-K2.5"
  },
  {
    id: "kimi-coding",
    name: "Kimi Coding Plan",
    group: "coding",
    apiUrl: "https://api.kimi.com/coding/v1/chat/completions",
    defaultModel: "kimi-for-coding"
  },
  // 自定义
  {
    id: "custom",
    name: "\u81EA\u5B9A\u4E49",
    group: "custom",
    apiUrl: "",
    defaultModel: ""
  }
];
const getProvider = (id) => PROVIDERS.find((p) => p.id === id);
const getProvidersByGroup = (groupId) => PROVIDERS.filter((p) => p.group === groupId);
export {
  PROVIDERS,
  PROVIDER_GROUPS,
  getProvider,
  getProvidersByGroup
};
