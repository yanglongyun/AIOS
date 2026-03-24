import readline from 'readline';
import { execSync, spawn } from 'child_process';
import chalk from 'chalk';
import { ROOT } from './config.ts';
import { stopServices } from './service.ts';
import t from './locale.ts';

const ask = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });

export const runUninstall = async () => {
  console.log();
  console.log(chalk.red('  ' + t.uninstallTitle));
  console.log(chalk.dim('  ─────────────────────────────────────'));
  console.log(chalk.dim(`  ${t.uninstallDir} ${ROOT}`));
  console.log();

  const confirm = await ask(chalk.yellow('  ' + t.uninstallConfirm + ' [y/N] '));
  if (confirm !== 'y' && confirm !== 'yes') {
    console.log(chalk.dim('  ' + t.uninstallCancelled));
    process.exit(0);
  }

  console.log();
  console.log(chalk.dim('  ' + t.uninstallStopping));
  stopServices();

  console.log(chalk.dim('  ' + t.uninstallUnlinking));
  try {
    execSync('npm unlink -g aios', { cwd: ROOT, stdio: 'pipe' });
  } catch {
    // 忽略 unlink 失败（可能已不在 global 中）
  }

  // 当前进程运行在 ROOT 中，延迟 1s 由子 shell 删除目录
  console.log(chalk.dim('  ' + t.uninstallRemoving));
  const cleanup = spawn('sh', ['-c', `sleep 1 && rm -rf "${ROOT}"`], {
    detached: true,
    stdio: 'ignore',
  });
  cleanup.unref();

  console.log();
  console.log(chalk.green('  ' + t.uninstallDone));
  console.log();
  process.exit(0);
};
