// 执行 shell 命令 · bash · 默认 30s 超时

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const pexec = promisify(exec);

export async function shell(args = {}) {
  const command = String(args?.command || '').trim();
  if (!command) throw new Error('command_required');

  const timeoutMs = Number(args?.timeoutMs) > 0 ? Number(args.timeoutMs) : 30_000;
  const cwd = typeof args?.cwd === 'string' && args.cwd ? args.cwd : undefined;
  const env = { ...process.env, ...(args?.env && typeof args.env === 'object' ? args.env : {}) };

  try {
    const r = await pexec(command, {
      timeout: timeoutMs,
      cwd,
      env,
      maxBuffer: 5 * 1024 * 1024, // 5MB
      shell: '/bin/bash',
    });
    return {
      ok: true,
      stdout: String(r.stdout || ''),
      stderr: String(r.stderr || ''),
      exitCode: 0,
      command,
      cwd: cwd || process.cwd(),
    };
  } catch (e) {
    return {
      ok: false,
      stdout: String(e?.stdout || ''),
      stderr: String(e?.stderr || ''),
      exitCode: typeof e?.code === 'number' ? e.code : -1,
      error: e?.message || String(e),
      command,
      cwd: cwd || process.cwd(),
    };
  }
}
