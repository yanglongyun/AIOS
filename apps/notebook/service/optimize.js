import { instantTask } from "../../app_shared/instantTask.js";
const optimizeNotebook = async ({ content, prompt, taskTitle, req }) => {
  if (!content?.trim()) return { error: "\u5185\u5BB9\u4E3A\u7A7A", status: 400 };
  const promptText = String(prompt || "").trim();
  if (!promptText) return { error: "prompt \u4E0D\u80FD\u4E3A\u7A7A", status: 400 };
  const data = await instantTask({
    app: "notebook",
    title: String(taskTitle || "").trim() || "\u7B14\u8BB0\u6DA6\u8272",
    prompt: promptText,
    req
  });
  const result = (data.response || "").trim();
  if (!result) return { error: "\u4F18\u5316\u7ED3\u679C\u4E3A\u7A7A", status: 500 };
  return { result };
};
export {
  optimizeNotebook
};
