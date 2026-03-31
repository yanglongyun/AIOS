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
    "你在处理 subscriber（订阅机）的今日新闻简报生成请求。",
    "你可以自行使用 shell 搜索和阅读网页，再整理结果。",
    "最终只输出 JSON，不要输出任何其它文字。",
    'JSON 格式必须是：{"title":"...","brief":"...","content":"...","note":"..."}。',
    "其中 content 建议使用多段文本，包含要点列表。",
    `日期：${date}`,
    `用户关注方向：${focus}`
  ].join("\n");
};
const runScheduledRefresh = async () => {
  const profile = getProfile();
  const focus = profile?.focus || "";
  if (!focus) {
    console.error("[subscriber] 跳过定时收报：未设置 focus");
    return;
  }
  const date = toDateKey();
  const language = getSystemLanguage();
  const prompt = buildAutoPrompt(focus, language);
  console.log(language === "en" ? `[subscriber] auto briefing started ${date}` : `[subscriber] 定时收报开始 ${date}`);
  try {
    await refresh({
      focus,
      taskTitle: language === "en" ? `Subscriber Briefing ${date}` : `订阅收报 ${date}`,
      prompt
    });
    console.log(language === "en" ? `[subscriber] auto briefing finished ${date}` : `[subscriber] 定时收报完成 ${date}`);
  } catch (e) {
    console.error(language === "en" ? "[subscriber] auto briefing failed:" : "[subscriber] 定时收报失败:", e.message);
  }
};
const scheduleNext = () => {
  const profile = getProfile();
  const timeStr = profile?.scheduleTime || "08:00";
  const ms = calcMsUntil(timeStr);
  const hours = Math.floor(ms / 36e5);
  const mins = Math.floor(ms % 36e5 / 6e4);
  console.log(`[subscriber] 下次收报: ${timeStr} (${hours}h${mins}m 后)`);
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
    console.log("[subscriber] 未设置 focus，跳过定时任务");
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
