// @ts-nocheck
import { listLlmProviderGroups, listLlmProviders } from "../../ai/llm/models.js";

const handleSettingsModelsGet = async (_req, res, { sendJson }) => {
  sendJson(res, 200, {
    ok: true,
    groups: listLlmProviderGroups(),
    providers: listLlmProviders(),
  });
};

export { handleSettingsModelsGet };
