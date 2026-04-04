import { providerGroups, listProviderDefinitions } from "../../llm/providers.js";

const listProviderCatalog = () => ({
  groups: providerGroups.map((group) => ({ ...group })),
  providers: listProviderDefinitions().map((item) => ({
    id: item.id,
    name: item.name,
    group: item.group,
    apiUrl: item.apiUrl,
    defaultModel: item.defaultModel,
    authMethods: Array.isArray(item.authMethods) ? [...item.authMethods] : ["apikey"],
    transports: Array.isArray(item.transports) ? [...item.transports] : ["chat"],
    defaultTransport: item.defaultTransport || "chat",
    supportsOAuth: item.supportsOAuth === true
  }))
});

export {
  listProviderCatalog
};
