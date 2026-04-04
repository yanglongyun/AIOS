const providerGroups = [
  { id: "default", name: "默认" },
  { id: "aggregator", name: "聚合平台" },
  { id: "coding", name: "Coding Plan" },
  { id: "wandesk", name: "Wandesk" },
  { id: "custom", name: "自定义" }
];

const providers = [
  { id: "openai", name: "OpenAI", group: "default", apiUrl: "https://api.openai.com/v1/chat/completions", defaultModel: "gpt-5.4", authMethods: ["apikey", "oauth"], transports: ["chat", "responses"], defaultTransport: "chat", supportsOAuth: true },
  { id: "claude", name: "Claude", group: "default", apiUrl: "https://api.anthropic.com/v1/chat/completions", defaultModel: "claude-sonnet-4-6", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "gemini", name: "Gemini", group: "default", apiUrl: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", defaultModel: "gemini-3-flash-preview", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "mistral", name: "Mistral", group: "default", apiUrl: "https://api.mistral.ai/v1/chat/completions", defaultModel: "mistral-large-latest", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "xai", name: "xAI (Grok)", group: "default", apiUrl: "https://api.x.ai/v1/chat/completions", defaultModel: "grok-4-1-fast-reasoning", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "deepseek", name: "DeepSeek", group: "default", apiUrl: "https://api.deepseek.com/chat/completions", defaultModel: "deepseek-chat", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "qwen", name: "Qwen (通义千问)", group: "default", apiUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", defaultModel: "qwen3.6-plus", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "glm", name: "GLM (智谱)", group: "default", apiUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions", defaultModel: "glm-5", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "zai", name: "Z.ai", group: "default", apiUrl: "https://api.z.ai/api/paas/v4/chat/completions", defaultModel: "glm-5", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "kimi", name: "Kimi (月之暗面)", group: "default", apiUrl: "https://api.moonshot.cn/v1/chat/completions", defaultModel: "kimi-k2.5", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "stepfun", name: "StepFun (阶跃星辰)", group: "default", apiUrl: "https://api.stepfun.com/v1/chat/completions", defaultModel: "step-3.5-flash", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "minimax", name: "MiniMax", group: "default", apiUrl: "https://api.minimaxi.com/v1/chat/completions", defaultModel: "MiniMax-M2.7", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "doubao", name: "Doubao (豆包)", group: "default", apiUrl: "https://ark.cn-beijing.volces.com/api/v3/chat/completions", defaultModel: "doubao-seed-2-0-pro-260215", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "openrouter", name: "OpenRouter", group: "aggregator", apiUrl: "https://openrouter.ai/api/v1/chat/completions", defaultModel: "google/gemini-3-flash-preview", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "together", name: "Together AI", group: "aggregator", apiUrl: "https://api.together.xyz/v1/chat/completions", defaultModel: "moonshotai/Kimi-K2.5", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "fireworks", name: "Fireworks AI", group: "aggregator", apiUrl: "https://api.fireworks.ai/inference/v1/chat/completions", defaultModel: "glm-5", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "glm-coding", name: "智谱 Coding Plan", group: "coding", apiUrl: "https://open.bigmodel.cn/api/coding/paas/v4/chat/completions", defaultModel: "glm-5", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "aliyun-coding", name: "阿里云 Coding Plan", group: "coding", apiUrl: "https://coding.dashscope.aliyuncs.com/v1/chat/completions", defaultModel: "qwen3-coder-plus", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "ark-coding", name: "火山引擎 Coding Plan", group: "coding", apiUrl: "https://ark.cn-beijing.volces.com/api/coding/v3/chat/completions", defaultModel: "doubao-seed-2.0-pro", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "tencent-coding", name: "腾讯云 Coding Plan", group: "coding", apiUrl: "https://api.lkeap.cloud.tencent.com/coding/v3/chat/completions", defaultModel: "minimax-m2.5", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "jdcloud-coding", name: "京东云 Coding Plan", group: "coding", apiUrl: "https://modelservice.jdcloud.com/coding/openai/v1/chat/completions", defaultModel: "Kimi-K2.5", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "kimi-coding", name: "Kimi Coding Plan", group: "coding", apiUrl: "https://api.kimi.com/coding/v1/chat/completions", defaultModel: "kimi-for-coding", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "wandesk", name: "Wandesk", group: "wandesk", apiUrl: "https://wandesk.ai/api/agent/chat/completions", defaultModel: "aios-nova", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" },
  { id: "custom", name: "自定义", group: "custom", apiUrl: "", defaultModel: "", authMethods: ["apikey"], transports: ["chat"], defaultTransport: "chat" }
];

const providerMap = new Map(providers.map((item) => [item.id, item]));

const getProviderDefinition = (id) => providerMap.get(id) || providerMap.get("custom");

const listProviderDefinitions = () => providers.map((item) => ({ ...item }));

const resolveProviderTransport = ({ provider, authMethod } = {}) => {
  const definition = getProviderDefinition(provider);
  if (authMethod === "oauth" && definition.id === "openai" && definition.transports.includes("responses")) {
    return "responses";
  }
  return definition.defaultTransport || "chat";
};

export {
  providerGroups,
  providers,
  getProviderDefinition,
  listProviderDefinitions,
  resolveProviderTransport
};
