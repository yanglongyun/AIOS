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

export const listRuns = async (jobId) => {
  if (!jobId) return { status: 400, message: 'jobId 必填' };
  const out = await run(`openclaw cron runs --id ${jobId} --json`);
  const data = parseJson(out);
  if (!data) return { status: 500, message: 'openclaw cron runs 输出解析失败' };
  return { success: true, runs: data };
};
