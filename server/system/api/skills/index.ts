// @ts-nocheck
import { listSkillSummaries } from "../../services/prompt/skills.js";

const handleSkillsApi = async (_req, res, { sendJson }, path, method) => {
  if (path !== "/api/skills" || method !== "GET") {
    sendJson(res, 404, { ok: false, error: "Not found" });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    skills: listSkillSummaries(),
  });
};

export { handleSkillsApi };
