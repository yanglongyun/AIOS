const applyTemplate = (template, cfg) => {
  return String(template || "")
    .replaceAll("{{goal}}", String(cfg.goal || ""))
    .replaceAll("{{base_url}}", String(cfg.base_url || "https://www.okx.com"))
    .replaceAll("{{api_key}}", String(cfg.api_key || ""))
    .replaceAll("{{api_secret}}", String(cfg.api_secret || ""))
    .replaceAll("{{passphrase}}", String(cfg.passphrase || ""));
};
const requestDecisionTask = async (cfg) => {
  const title = applyTemplate(cfg.task_title_template, cfg).trim() || (cfg.locale === "zh" ? "炒币机自主执行" : "Cryptobot Autonomous Run");
  const prompt = applyTemplate(cfg.task_prompt_template, cfg).trim();
  const resp = await fetch("http://localhost:9500/api/task/create/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app: "cryptobot",
      title,
      prompt
    })
  });
  const data = await resp.json();
  if (!resp.ok || data.success === false) {
    throw new Error(data.message || data.error || `request failed ${resp.status}`);
  }
  const summary = String(data.response || "").trim() || (cfg.locale === "zh" ? "本轮任务已执行，但未返回有效总结。" : "This run completed, but no valid summary was returned.");
  return {
    summary: summary.slice(0, 1200),
    task_id: Number(data.id || 0)
  };
};
export {
  requestDecisionTask
};
