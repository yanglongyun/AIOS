import { exec } from "child_process";
const run = (cmd) => new Promise((resolve, reject) => {
  exec(cmd, { timeout: 1e4 }, (err, stdout, stderr) => {
    if (err) return reject(new Error(stderr?.trim() || err.message));
    resolve(stdout.trim());
  });
});
const parseJson = (str) => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};
const quote = (value) => `"${String(value ?? "").replace(/"/g, '\\"')}"`;
const normalizeJob = (job) => {
  const schedule = {};
  if (job?.schedule?.kind === "cron") schedule.cron = job.schedule.expr || "";
  else if (job?.schedule?.kind === "at") schedule.at = job.schedule.at || "";
  else if (job?.schedule?.kind === "every") schedule.every = Number(job.schedule.everyMs || 0) || 0;
  let lastRunAt = "";
  if (job?.state?.lastRunAtMs) {
    const ts = Number(job.state.lastRunAtMs);
    if (Number.isFinite(ts) && ts > 0) lastRunAt = new Date(ts).toISOString().replace("T", " ").slice(0, 19);
  }
  return {
    ...job,
    schedule,
    prompt: String(job?.payload?.message || ""),
    lastRunAt
  };
};
const listCron = async () => {
  const out = await run("openclaw cron list --json");
  const data = parseJson(out);
  if (!data) return { status: 500, message: "openclaw cron list \u8F93\u51FA\u89E3\u6790\u5931\u8D25" };
  const rawJobs = Array.isArray(data) ? data : Array.isArray(data.jobs) ? data.jobs : [];
  return { success: true, jobs: rawJobs.map(normalizeJob) };
};
const addCron = async ({ name, schedule, prompt, sessionTarget }) => {
  if (!name || !prompt) return { status: 400, message: "name \u548C prompt \u5FC5\u586B" };
  const args = [`--name ${quote(name)}`];
  if (schedule?.cron) args.push(`--cron ${quote(schedule.cron)}`);
  else if (schedule?.at) args.push(`--at ${quote(schedule.at)}`);
  else if (schedule?.every) args.push(`--every ${schedule.every}`);
  args.push(`--message ${quote(prompt)}`);
  if (sessionTarget) args.push(`--session ${sessionTarget}`);
  const out = await run(`openclaw cron add ${args.join(" ")}`);
  return { success: true, output: out };
};
const updateCron = async ({ jobId, name, schedule, prompt, sessionTarget }) => {
  const id = String(jobId || "").trim();
  const n = String(name || "").trim();
  const p = String(prompt || "").trim();
  if (!id) return { status: 400, message: "jobId \u5FC5\u586B" };
  if (!n || !p) return { status: 400, message: "name \u548C prompt \u5FC5\u586B" };
  if (!schedule?.cron && !schedule?.at && !schedule?.every) return { status: 400, message: "schedule \u5FC5\u586B" };
  const args = [id, `--name ${quote(n)}`];
  if (schedule?.cron) args.push(`--cron ${quote(schedule.cron)}`);
  else if (schedule?.at) args.push(`--at ${quote(schedule.at)}`);
  else args.push(`--every ${Number(schedule.every)}`);
  args.push(`--message ${quote(p)}`);
  if (sessionTarget) args.push(`--session ${sessionTarget}`);
  const out = await run(`openclaw cron edit ${args.join(" ")}`);
  return { success: true, output: out };
};
const runCron = async (jobId) => {
  if (!jobId) return { status: 400, message: "jobId \u5FC5\u586B" };
  const out = await run(`openclaw cron run ${jobId} --session main`);
  return { success: true, output: out };
};
const listCronRuns = async ({ jobId, limit = 20 }) => {
  const id = String(jobId || "").trim();
  const n = Number(limit);
  if (!id) return { status: 400, message: "jobId \u5FC5\u586B" };
  if (!Number.isInteger(n) || n <= 0 || n > 100) return { status: 400, message: "limit \u5FC5\u987B\u662F 1-100 \u7684\u6574\u6570" };
  const out = await run(`openclaw cron runs --id ${id} --limit ${n}`);
  const data = parseJson(out);
  if (!data || !Array.isArray(data.entries)) return { status: 500, message: "openclaw cron runs \u8F93\u51FA\u89E3\u6790\u5931\u8D25" };
  const entries = data.entries.map((it) => ({
    ts: Number(it.ts || 0) || 0,
    action: String(it.action || ""),
    status: String(it.status || ""),
    error: String(it.error || ""),
    summary: String(it.summary || ""),
    durationMs: Number(it.durationMs || 0) || 0,
    model: String(it.model || ""),
    provider: String(it.provider || "")
  }));
  return { success: true, entries };
};
const deleteCron = async (jobId) => {
  if (!jobId) return { status: 400, message: "jobId \u5FC5\u586B" };
  const out = await run(`openclaw cron delete ${jobId}`);
  return { success: true, output: out };
};
export {
  addCron,
  deleteCron,
  listCron,
  listCronRuns,
  runCron,
  updateCron
};
