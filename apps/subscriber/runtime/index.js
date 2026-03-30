import { getProfile } from "../repository/today.js";
import { refresh } from "../service/refresh.js";
import { toDateKey } from "../../../shared/time/dateKey.js";
import { getSystemLanguage } from "../../app_shared/settings/language.js";
let timer = null;
const calcMsUntil = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  const now = /* @__PURE__ */ new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
};
const buildAutoPrompt = (focus, lang) => {
  const date = toDateKey();
  if (lang === "en") {
    return [
      "Generate today's subscriber briefing.",
      "You may browse and read web sources before summarizing.",
      'Return JSON only: {"title":"...","brief":"...","content":"...","note":"..."}',
      "content should be multi-paragraph and include key bullet points.",
      `Date: ${date}`,
      `Focus: ${focus}`
    ].join("\n");
  }
  return [
    "\u4F60\u5728\u5904\u7406 subscriber\uFF08\u8BA2\u9605\u673A\uFF09\u7684\u4ECA\u65E5\u65B0\u95FB\u7B80\u62A5\u751F\u6210\u8BF7\u6C42\u3002",
    "\u4F60\u53EF\u4EE5\u81EA\u884C\u4F7F\u7528 shell \u641C\u7D22\u548C\u9605\u8BFB\u7F51\u9875\uFF0C\u518D\u6574\u7406\u7ED3\u679C\u3002",
    "\u6700\u7EC8\u53EA\u8F93\u51FA JSON\uFF0C\u4E0D\u8981\u8F93\u51FA\u4EFB\u4F55\u5176\u5B83\u6587\u5B57\u3002",
    'JSON \u683C\u5F0F\u5FC5\u987B\u662F\uFF1A{"title":"...","brief":"...","content":"...","note":"..."}\u3002',
    "\u5176\u4E2D content \u5EFA\u8BAE\u4F7F\u7528\u591A\u6BB5\u6587\u672C\uFF0C\u5305\u542B\u8981\u70B9\u5217\u8868\u3002",
    `\u65E5\u671F\uFF1A${date}`,
    `\u7528\u6237\u5173\u6CE8\u65B9\u5411\uFF1A${focus}`
  ].join("\n");
};
const runScheduledRefresh = async () => {
  const profile = getProfile();
  const focus = profile?.focus || "";
  if (!focus) {
    console.error("[subscriber] \u8DF3\u8FC7\u5B9A\u65F6\u6536\u62A5\uFF1A\u672A\u8BBE\u7F6E focus");
    return;
  }
  const date = toDateKey();
  const language = getSystemLanguage();
  const prompt = buildAutoPrompt(focus, language);
  console.log(language === "en" ? `[subscriber] auto briefing started ${date}` : `[subscriber] \u5B9A\u65F6\u6536\u62A5\u5F00\u59CB ${date}`);
  try {
    await refresh({
      focus,
      taskTitle: language === "en" ? `Subscriber Briefing ${date}` : `\u8BA2\u9605\u6536\u62A5 ${date}`,
      prompt
    });
    console.log(language === "en" ? `[subscriber] auto briefing finished ${date}` : `[subscriber] \u5B9A\u65F6\u6536\u62A5\u5B8C\u6210 ${date}`);
  } catch (e) {
    console.error(language === "en" ? "[subscriber] auto briefing failed:" : "[subscriber] \u5B9A\u65F6\u6536\u62A5\u5931\u8D25:", e.message);
  }
};
const scheduleNext = () => {
  const profile = getProfile();
  const timeStr = profile?.scheduleTime || "08:00";
  const ms = calcMsUntil(timeStr);
  const hours = Math.floor(ms / 36e5);
  const mins = Math.floor(ms % 36e5 / 6e4);
  console.log(`[subscriber] \u4E0B\u6B21\u6536\u62A5: ${timeStr} (${hours}h${mins}m \u540E)`);
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    await runScheduledRefresh();
    scheduleNext();
  }, ms);
};
const initRuntime = () => {
  const profile = getProfile();
  if (profile?.focus) {
    scheduleNext();
  } else {
    console.log("[subscriber] \u672A\u8BBE\u7F6E focus\uFF0C\u8DF3\u8FC7\u5B9A\u65F6\u4EFB\u52A1");
  }
};
const reschedule = () => {
  scheduleNext();
};
const stopSchedule = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
};
export {
  initRuntime,
  reschedule,
  stopSchedule
};
