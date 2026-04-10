import { getConfig, saveConfig } from "../repository/config.js";
import { fetchAccountTotalEq } from "../runtime/okx.js";
import { startBot } from "../runtime/index.js";
const start = async (body = {}) => {
  const cfg = getConfig();
  const equity = await fetchAccountTotalEq(cfg);
  saveConfig({
    initial_equity: equity,
    current_equity: equity,
    locale: body.locale || cfg.locale || "en",
    task_title_template: body.task_title_template || cfg.task_title_template || "",
    task_prompt_template: body.task_prompt_template || cfg.task_prompt_template || ""
  });
  startBot(body.interval_sec);
  return { success: true };
};
export {
  start
};
