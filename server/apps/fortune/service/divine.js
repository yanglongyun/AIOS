import { instantTaskJson } from "../../../shared/apps/instantTask.js";
import { insertRecord } from "../repository/divine.js";
const divine = async ({ question, hexagram, messages, taskTitle, req }) => {
  const taskMessages = Array.isArray(messages) ? messages : [];
  if (taskMessages.length === 0) return { status: 400, message: "messages are required" };
  const parsed = await instantTaskJson({
    app: "fortune",
    title: String(taskTitle || "").trim() || "周易解卦",
    payload: {
      messages: taskMessages,
      response_format: { type: "json_object" }
    },
    req
  });
  const record = {
    question,
    signName: String(parsed.signName || "").trim() || "未知",
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
