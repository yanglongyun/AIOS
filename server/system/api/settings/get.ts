// @ts-nocheck
import { getServerSettings } from "../../services/settings/index.js";
import { DEFAULT_SYSTEM_PROMPT } from "../../services/prompt/default.js";

const handleSettingsGet = async (_req, res, { sendJson }) => {
  sendJson(res, 200, {
    ok: true,
    settings: getServerSettings(),
    defaultSystem: DEFAULT_SYSTEM_PROMPT,
  });
};

export { handleSettingsGet };
