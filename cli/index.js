#!/usr/bin/env node
import { execSync } from 'child_process';
import chalk from 'chalk';
import { WEB_URL, API_URL, APPS_URL } from './config.js';
import { getServiceStatus, startServices, stopServices, buildUI, isReady, waitReadyUrl } from './service.js';
import { startChat } from './chat.js';

const arg = process.argv[2];

if (arg === 'web') {
  const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
  console.log(chalk.dim(`Opening ${WEB_URL} ...`));
  execSync(`${cmd} ${WEB_URL}`);
  process.exit(0);
}

if (arg === 'start') {
  const serverReady = await isReady(`${API_URL}/health`);
  const appsReady = await isReady(`${APPS_URL}/apps/health`);
  if (serverReady && appsReady) {
    console.log(chalk.green('AIOS 服务已在运行'));
    process.exit(0);
  }

  startServices();
  process.stdout.write(chalk.dim('  等待服务就绪'));
  const serverOk = await waitReadyUrl(`${API_URL}/health`);
  const appsOk = await waitReadyUrl(`${APPS_URL}/apps/health`);
  console.log();

  if (!serverOk || !appsOk) {
    console.error(chalk.red('启动失败: 服务未就绪'));
    process.exit(1);
  }

  console.log(chalk.green('AIOS 服务已启动'));
  console.log(chalk.dim(`  主服务: ${WEB_URL}`));
  console.log(chalk.dim(`  应用服务: ${APPS_URL}`));
  process.exit(0);
}

if (arg === 'restart') {
  stopServices();

  console.log(chalk.dim('  构建前端...'));
  if (buildUI()) {
    console.log(chalk.dim('  构建完成'));
  } else {
    console.log(chalk.yellow('  构建失败，使用已有版本'));
  }

  startServices();
  process.stdout.write(chalk.dim('  等待服务就绪'));
  const serverOk = await waitReadyUrl(`${API_URL}/health`);
  const appsOk = await waitReadyUrl(`${APPS_URL}/apps/health`);
  console.log();

  if (!serverOk || !appsOk) {
    console.error(chalk.red('重启失败: 服务未就绪'));
    process.exit(1);
  }

  console.log(chalk.green('AIOS 服务已重启'));
  console.log(chalk.dim(`  主服务: ${WEB_URL}`));
  console.log(chalk.dim(`  应用服务: ${APPS_URL}`));
  process.exit(0);
}

if (arg === 'stop') {
  const stopped = stopServices();
  if (stopped) console.log(chalk.green('AIOS 服务已停止'));
  else console.log(chalk.yellow('未发现运行中的 AIOS 服务'));
  process.exit(0);
}

if (arg === 'status') {
  const status = await getServiceStatus();
  const formatState = (running, ready) => {
    if (!running) return chalk.red('未运行');
    if (!ready) return chalk.yellow('运行中(未就绪)');
    return chalk.green('运行中(就绪)');
  };

  console.log(chalk.bold('AIOS 服务状态'));
  console.log(`  主服务(9700): ${formatState(status.server.running, status.server.ready)}`);
  console.log(`    PID: ${status.server.pids.length ? status.server.pids.join(', ') : '-'}`);
  console.log(`  应用服务(9701): ${formatState(status.apps.running, status.apps.ready)}`);
  console.log(`    PID: ${status.apps.pids.length ? status.apps.pids.join(', ') : '-'}`);
  process.exit(status.server.ready && status.apps.ready ? 0 : 1);
}

// 默认：交互式对话
startChat();
