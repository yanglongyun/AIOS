import { execFile } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import { platform } from 'node:os';
import { dirname } from 'node:path';
import { promisify } from 'node:util';

export const DEFAULT_TIMEOUT_MS = 30_000;

const execFileAsync = promisify(execFile);

export async function commandExists(command) {
  try {
    if (platform() === 'win32') {
      await execFileAsync('where', [command], { timeout: 3000 });
    } else {
      await execFileAsync('sh', ['-lc', `command -v ${shellQuote(command)}`], { timeout: 3000 });
    }
    return true;
  } catch {
    return false;
  }
}

export async function run(command, args, options = {}) {
  const { stdout, stderr } = await execFileAsync(command, args, {
    timeout: options.timeout ?? DEFAULT_TIMEOUT_MS,
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
  });
  return { stdout: stdout.trim(), stderr: stderr.trim() };
}

export function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

export function numberArg(value, name) {
  const num = Number(value);
  if (!Number.isFinite(num)) throw new Error(`invalid_${name}`);
  return Math.round(num);
}

export function amountArg(value, fallback = 1) {
  const num = Number(value ?? fallback);
  if (!Number.isFinite(num) || num < 1) return fallback;
  return Math.min(Math.round(num), 100);
}

export function defaultScreenshotPath() {
  return `/tmp/computer-use-${Date.now()}.png`;
}

export async function ensureParent(path) {
  await mkdir(dirname(path), { recursive: true });
}

export async function fileSize(path) {
  const info = await stat(path);
  return info.size;
}

export function normalizeKey(key) {
  return String(key || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
}
