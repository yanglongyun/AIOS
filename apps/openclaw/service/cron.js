import { exec } from 'child_process';

const run = (cmd) => new Promise((resolve, reject) => {
  exec(cmd, { timeout: 10000 }, (err, stdout, stderr) => {
    if (err) return reject(new Error(stderr?.trim() || err.message));
    resolve(stdout.trim());
  });
});

const parseJson = (str) => {
  try { return JSON.parse(str); } catch { return null; }
};

export const listCron = async () => {
  const out = await run('openclaw cron list --json');
  const data = parseJson(out);
  if (!data) return { status: 500, message: 'openclaw cron list 输出解析失败' };
  return { success: true, jobs: data };
};

export const addCron = async ({ name, schedule, prompt, sessionTarget }) => {
  if (!name || !prompt) return { status: 400, message: 'name 和 prompt 必填' };
  const args = [`--name "${name}"`];
  if (schedule?.cron) args.push(`--cron "${schedule.cron}"`);
  else if (schedule?.at) args.push(`--at "${schedule.at}"`);
  else if (schedule?.every) args.push(`--every ${schedule.every}`);
  args.push(`--message "${prompt.replace(/"/g, '\\"')}"`);
  if (sessionTarget) args.push(`--session ${sessionTarget}`);
  const out = await run(`openclaw cron add ${args.join(' ')}`);
  return { success: true, output: out };
};

export const runCron = async (jobId) => {
  if (!jobId) return { status: 400, message: 'jobId 必填' };
  const out = await run(`openclaw cron run ${jobId}`);
  return { success: true, output: out };
};

export const deleteCron = async (jobId) => {
  if (!jobId) return { status: 400, message: 'jobId 必填' };
  const out = await run(`openclaw cron delete ${jobId} --yes`);
  return { success: true, output: out };
};
