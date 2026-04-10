import { instantTask } from "../../app_shared/instantTask.js";

const digest = async ({ repo, title = "", prompt = "" }) => {
  const result = await instantTask({
    app: "ghtrending",
    title: String(title || "").trim() || String(repo?.name || "GitHub Trending Digest"),
    prompt: String(prompt || "").trim()
  });
  return { success: true, analysis: result.response || "" };
};

export { digest };
