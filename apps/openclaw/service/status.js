import { exec } from 'child_process';

const run = (cmd) => new Promise((resolve) => {
  exec(cmd, { timeout: 5000 }, (err, stdout) => {
    resolve(err ? null : stdout.trim());
  });
});

export const getStatus = async () => {
  const version = await run('openclaw --version');
  if (!version) return { online: false, version: null, gateway: false };

  let gateway = false;
  try {
    const res = await fetch('http://localhost:18789/', { signal: AbortSignal.timeout(3000) });
    gateway = res.ok || res.status < 500;
  } catch {}

  return { online: true, version, gateway };
};
