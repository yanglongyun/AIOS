import { resolveOAuth } from "./common.js";
import { resolveProviderTransport } from "./providers.js";
import { callChatRegular, callChatStream } from "./chat/completions.js";
import { callCodexStream } from "./responses/openai.js";

const resolveRouteContext = async (provider) => {
  const oauth = await resolveOAuth(provider);
  return {
    oauth,
    transport: resolveProviderTransport({
      provider,
      authMethod: oauth.useCodex ? "oauth" : "apikey"
    })
  };
};

const callLlmStream = async (provider, apiUrl, apiKey, payload, { signal, onDelta } = {}) => {
  const route = await resolveRouteContext(provider);
  if (route.transport === "responses") {
    return callCodexStream(route.oauth.accessToken, route.oauth.accountId, payload, { signal, onDelta });
  }
  return callChatStream(provider, apiUrl, apiKey, payload, { signal, onDelta });
};

const callLlmRegular = async (provider, apiUrl, apiKey, payload, signal) => {
  const route = await resolveRouteContext(provider);
  if (route.transport === "responses") {
    return callCodexStream(route.oauth.accessToken, route.oauth.accountId, payload, { signal });
  }
  return callChatRegular(provider, apiUrl, apiKey, payload, signal);
};

export {
  callLlmRegular,
  callLlmStream
};
