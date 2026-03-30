import { instantTaskJson } from "../../app_shared/instantTask.js";
import { insertSession } from "../repository/generation.js";
const generate = async ({ history, now, choices, next, prompt, messages, taskTitle, req }) => {
  const promptText = String(prompt || "").trim();
  if (!promptText) return { status: 400, message: "prompt \u4E0D\u80FD\u4E3A\u7A7A" };
  const taskMessages = Array.isArray(messages) ? messages : [];
  if (taskMessages.length === 0) return { status: 400, message: "messages \u4E0D\u80FD\u4E3A\u7A7A" };
  const parsed = await instantTaskJson({
    app: "banana",
    title: String(taskTitle || "").trim() || "\u8001\u624B\u673A\u754C\u9762\u751F\u6210",
    schema: { required: ["content", "options"] },
    prompt: promptText,
    messages: taskMessages,
    req
  });
  const result = {
    content: String(parsed.content || ""),
    options: Array.isArray(parsed.options) ? parsed.options.map((o) => ({ text: String(o.text || "") })) : []
  };
  try {
    insertSession({
      currentScreen: result,
      screenHistory: { history, now, choices, next }
    });
  } catch (e) {
    console.error("\u4FDD\u5B58 Banana \u8FDB\u5EA6\u5931\u8D25:", e.message);
  }
  return result;
};
export {
  generate
};
