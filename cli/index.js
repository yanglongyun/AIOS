#!/usr/bin/env node
import { execSync } from 'child_process';
import chalk from 'chalk';
import { WEB_URL, API_URL, APPS_URL } from './config.js';
import { startServices, stopServices, isReady, waitReadyUrl } from './service.js';
import { startChat } from './chat.js';

const arg = process.argv[2];

if (arg === 'web') {
  const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
  console.log(chalk.dim(`Opening ${WEB_URL} ...`));
  execSync(`${cmd} ${WEB_URL}`);
  process.exit(0);
}

if (arg === 'start') {
  const serverReady = await isReady(`${API_URL}/chat/list`);
  const appsReady = await isReady(`${APPS_URL}/apps/notebook/list`);
  if (serverReady && appsReady) {
    console.log(chalk.green('AIOS 服务已在运行'));
    process.exit(0);
  }

  startServices();
  process.stdout.write(chalk.dim('  等待服务就绪'));
  const serverOk = await waitReadyUrl(`${API_URL}/chat/list`);
  const appsOk = await waitReadyUrl(`${APPS_URL}/apps/notebook/list`);
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

if (arg === 'stop') {
  const stopped = stopServices();
  if (stopped) console.log(chalk.green('AIOS 服务已停止'));
  else console.log(chalk.yellow('未发现运行中的 AIOS 服务'));
  process.exit(0);
}

// 默认：交互式对话
startChat();
