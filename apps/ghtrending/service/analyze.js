import { agentTask } from "../../app_shared/agentTask.js";

const analyze = async ({ repo, title = "", prompt = "" }) => {
  const result = await agentTask({
    app: "ghtrending",
    title: String(title || "").trim() || `Analyze: ${repo.name}`,
    prompt: String(prompt || "").trim()
  });
  return { success: true, analysis: result.response || "" };
};

export { analyze };
