const buildHeaders = (apiKey) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${apiKey}`,
});

const normalizeUsage = (usage) => {
  if (!usage || typeof usage !== "object") return null;

  const promptTokens = Math.max(0, Number(usage.prompt_tokens) || 0);
  const completionTokens = Math.max(0, Number(usage.completion_tokens) || 0);
  const totalTokens = Math.max(
    0,
    Number(usage.total_tokens) || promptTokens + completionTokens,
  );
  const cachedPromptTokens = Math.max(
    0,
    Number(usage.prompt_tokens_details?.cached_tokens) || 0,
  );

  return {
    promptTokens,
    cachedPromptTokens,
    completionTokens,
    totalTokens,
  };
};

const callChatCompletion = async (apiUrl, apiKey, payload, { signal } = {}) => {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: buildHeaders(apiKey),
    body: JSON.stringify({
      ...payload,
      stream: false,
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM ${res.status}: ${text}`);
  }

  const json = await res.json();
  const message = json?.choices?.[0]?.message;
  if (!message) {
    throw new Error("LLM response missing choices[0].message");
  }

  return {
    message,
    usage: normalizeUsage(json?.usage),
  };
};

export {
  callChatCompletion,
  normalizeUsage,
};
