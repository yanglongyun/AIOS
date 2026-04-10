import { db } from "./client.js";
const getConfig = () => {
  const row = db.prepare("SELECT * FROM cryptobot_config WHERE id = 1").get();
  if (!row) {
    db.prepare(`
      INSERT INTO cryptobot_config (id, base_url, goal, locale, task_title_template, task_prompt_template, interval_sec, initial_equity, current_equity, updated_at)
      VALUES (1, 'https://www.okx.com', '', 'en', '', '', 300, 0, 0, datetime('now'))
    `).run();
    return { id: 1, base_url: "https://www.okx.com", api_key: "", api_secret: "", passphrase: "", goal: "", locale: "en", task_title_template: "", task_prompt_template: "", interval_sec: 300, initial_equity: 0, current_equity: 0 };
  }
  return {
    ...row,
    locale: row.locale || "en",
    task_title_template: row.task_title_template || "",
    task_prompt_template: row.task_prompt_template || ""
  };
};
const saveConfig = (patch = {}) => {
  const cfg = { ...getConfig(), ...patch };
  db.prepare(`
    UPDATE cryptobot_config
    SET base_url = ?, api_key = ?, api_secret = ?, passphrase = ?,
        goal = ?, locale = ?, task_title_template = ?, task_prompt_template = ?,
        interval_sec = ?, initial_equity = ?, current_equity = ?,
        updated_at = datetime('now')
    WHERE id = 1
  `).run(
    cfg.base_url,
    cfg.api_key,
    cfg.api_secret,
    cfg.passphrase,
    cfg.goal,
    cfg.locale || "en",
    cfg.task_title_template || "",
    cfg.task_prompt_template || "",
    cfg.interval_sec,
    cfg.initial_equity,
    cfg.current_equity
  );
  return getConfig();
};
export {
  getConfig,
  saveConfig
};
