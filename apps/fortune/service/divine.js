import { instantTaskJson } from "../../app_shared/instantTask.js";
import { insertRecord } from "../repository/divine.js";
const divine = async ({ question, hexagram, prompt, messages, taskTitle, req }) => {
  const promptText = String(prompt || "").trim();
  if (!promptText) return { status: 400, message: "prompt \u4E0D\u80FD\u4E3A\u7A7A" };
  const taskMessages = Array.isArray(messages) ? messages : [];
  if (taskMessages.length === 0) return { status: 400, message: "messages \u4E0D\u80FD\u4E3A\u7A7A" };
  const parsed = await instantTaskJson({
    app: "fortune",
    title: String(taskTitle || "").trim() || "\u5468\u6613\u89E3\u5366",
    schema: { required: ["signName", "signPoem", "good", "bad", "advice"] },
    prompt: promptText,
    messages: taskMessages,
    req
  });
  const record = {
    question,
    signName: String(parsed.signName || "").trim() || "\u672A\u77E5",
    signPoem: String(parsed.signPoem || "").trim() || "",
    good: String(parsed.good || "").trim() || "",
    bad: String(parsed.bad || "").trim() || "",
    advice: String(parsed.advice || "").trim() || "",
    hexagram
  };
  const item = insertRecord(record);
  return { success: true, item };
};
export {
  divine
};
