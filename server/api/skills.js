// @ts-nocheck
import { getSkill, listSkills } from "../service/skills/index.js";

const handleSkillsApi = async (_req, res, { sendJson }, path, method, url) => {
  if (method !== "GET") {
    sendJson(res, 404, { error: "API endpoint not found" });
    return;
  }

  if (path === "/api/skills") {
    const id = url.searchParams.get("id");
    if (id) {
      const skill = await getSkill(id);
      if (!skill) {
        sendJson(res, 404, { ok: false, error: "skill not found" });
        return;
      }
      sendJson(res, 200, { ok: true, skill });
      return;
    }
    sendJson(res, 200, { ok: true, skills: await listSkills() });
    return;
  }

  sendJson(res, 404, { error: "API endpoint not found" });
};

export { handleSkillsApi };
