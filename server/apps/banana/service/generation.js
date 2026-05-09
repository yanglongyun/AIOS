import { instantTask } from "../../../shared/apps/instantTask.js";
import { parseJsonObject } from "../../../shared/ai/json.js";
import { insertSession } from "../repository/generation.js";

const generate = async ({ history, now, choices, next, prompt, messages, taskTitle, req }) => {
  const promptText = String(prompt || "").trim();
  if (!promptText) return { status: 400, message: "prompt is required" };

  const taskMessages = Array.isArray(messages) ? messages : [];
  if (taskMessages.length === 0) return { status: 400, message: "messages are required" };

  // 1. 调任务服务,任何上游错误直接带原文返回
  let task;
  try {
    task = await instantTask({
      app: "banana",
      title: String(taskTitle || "").trim() || "老手机界面生成",
      schema: { required: ["content", "options"] },
      prompt: promptText,
      messages: taskMessages,
      req
    });
  } catch (err) {
    console.error("[banana.generate] instantTask 失败:", err.message);
    return { status: 502, message: `任务服务报错: ${err.message}` };
  }

  const raw = String(task?.response || "");
  console.log("[banana.generate] AI 原文 (前 800 字):", raw.slice(0, 800));

  // 2. 解析 JSON,失败时把原文带回去
  let parsed;
  try {
    parsed = parseJsonObject(raw);
  } catch (err) {
    console.error("[banana.generate] JSON 解析失败:", err.message, "\n原文:", raw);
    return {
      status: 502,
      message: `AI 返回不是合法 JSON: ${err.message}`,
      raw
    };
  }

  // 3. 净化 options: 兼容 ["xxx"] 和 [{text:"xxx"}] 两种形状,去空 text、去重、最多 3 个
  const seen = new Set();
  const cleanOptions = (Array.isArray(parsed.options) ? parsed.options : [])
    .map((o) => {
      if (typeof o === "string") return o.trim();
      if (o && typeof o === "object") return String(o.text ?? o.label ?? o.title ?? "").trim();
      return "";
    })
    .filter((t) => {
      if (!t) return false;
      const k = t.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 3)
    .map((text) => ({ text }));

  if (cleanOptions.length === 0) {
    const fields = Object.keys(parsed || {});
    const rawOptionsKind = Array.isArray(parsed.options)
      ? `array(len=${parsed.options.length})`
      : `${typeof parsed.options}`;
    console.error(
      "[banana.generate] options 净化后为空。返回字段:",
      fields.join(",") || "(空对象)",
      "options 类型:", rawOptionsKind
    );
    return {
      status: 502,
      message:
        `AI 没给出可用选项 (返回字段: [${fields.join(", ") || "空"}], options=${rawOptionsKind})`,
      raw,
      parsed
    };
  }

  const result = {
    content: String(parsed.content || ""),
    options: cleanOptions
  };

  try {
    insertSession({
      currentScreen: result,
      screenHistory: { history, now, choices, next }
    });
  } catch (e) {
    console.error("Failed to save Banana progress:", e.message);
  }

  return result;
};

export { generate };
