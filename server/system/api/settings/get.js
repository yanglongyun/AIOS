// @ts-nocheck
import { getServerSettings } from "../../services/settings/index.js";
import { DEFAULT_SYSTEM_PROMPT } from "../../services/prompt/identity.js";
import { buildSystemPrompt } from "../../services/prompt/index.js";
import { listSkills } from "../../services/prompt/skills.js";

const handleSettingsGet = async (_req, res, { sendJson }) => {
  const settings = getServerSettings();
  sendJson(res, 200, {
    ok: true,
    settings,
    defaultSystem: DEFAULT_SYSTEM_PROMPT,
    promptPreview: buildSystemPrompt("", [], settings),
    skills: listSkills().map((skill) => ({
      name: skill.name || "",
      description: skill.description || "",
    })),
  });
};

export { handleSettingsGet };
