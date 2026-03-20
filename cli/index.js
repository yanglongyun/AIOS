#!/usr/bin/env node
import { execSync } from 'child_process';
import chalk from 'chalk';
import { ROOT, WEB_URL, API_URL, APPS_URL, SERVER_PORT, APPS_PORT } from './config.js';
import { getServiceStatus, startServices, stopServices, buildUI, isReady, waitReadyUrl } from './service.js';
import { startChat } from './chat.js';
import { runUninstall } from './uninstall.js';
import t from './locale.js';
import { banner, createSpinner } from './ui.js';

const arg = process.argv[2];

const restartWithBuild = async (doneMessage) => {
  stopServices();

  console.log(chalk.dim('  ' + t.buildingUI));
  if (!buildUI()) {
    console.error(chalk.red('  ' + t.buildFailed));
    process.exit(1);
  }
  console.log(chalk.dim('  ' + t.buildDone));

  startServices();
  const spinner = createSpinner(t.waitingReady);
  spinner.start();
  const serverOk = await waitReadyUrl(`${API_URL}/health`);
  const appsOk = await waitReadyUrl(`${APPS_URL}/apps/health`);
  if (!serverOk || !appsOk) {
    spinner.fail(t.restartFailed);
    process.exit(1);
  }
  spinner.stop(doneMessage);
  console.log(chalk.dim(`  Server: ${WEB_URL}`));
  console.log(chalk.dim(`  Apps:   ${APPS_URL}`));
  process.exit(0);
};

if (arg === 'help' || arg === '--help' || arg === '-h') {
  banner();
  console.log(t.helpUsage);
  console.log(t.helpCommands + '\n');
  const cmds = [
    ['(default)', t.helpNone],
    ['start', t.helpStart],
    ['stop', t.helpStop],
    ['restart', t.helpRestart],
    ['update', t.helpUpdate],
    ['status', t.helpStatus],
    ['web', t.helpWeb],
    ['uninstall', t.helpUninstall],
    ['help', t.helpHelp],
  ];
  for (const [cmd, desc] of cmds) {
    console.log(`    ${chalk.green(cmd.padEnd(12))}${desc}`);
  }
  console.log();
  process.exit(0);
}

if (arg === 'web') {
  const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
  console.log(chalk.dim(`  Opening ${WEB_URL} ...`));
  execSync(`${cmd} ${WEB_URL}`);
  process.exit(0);
}

if (arg === 'start') {
  const serverReady = await isReady(`${API_URL}/health`);
  const appsReady = await isReady(`${APPS_URL}/apps/health`);
  if (serverReady && appsReady) {
    console.log(chalk.green('  ' + t.alreadyRunning));
    process.exit(0);
  }

  startServices();
  const spinner = createSpinner(t.waitingReady);
  spinner.start();
  const serverOk = await waitReadyUrl(`${API_URL}/health`);
  const appsOk = await waitReadyUrl(`${APPS_URL}/apps/health`);
  if (!serverOk || !appsOk) {
    spinner.fail(t.startFailed);
    process.exit(1);
  }
  spinner.stop(t.started);
  console.log(chalk.dim(`  Server: ${WEB_URL}`));
  console.log(chalk.dim(`  Apps:   ${APPS_URL}`));
  process.exit(0);
}

if (arg === 'restart') {
  await restartWithBuild(t.restarted);
}

if (arg === 'update') {
  console.log(chalk.dim('  ' + t.pullingCode));
  try {
    const hasChanges = execSync('git status --porcelain', { cwd: ROOT }).toString().trim();
    if (hasChanges) execSync('git stash', { cwd: ROOT, stdio: 'inherit' });
    execSync('git pull --ff-only', { cwd: ROOT, stdio: 'inherit' });
    if (hasChanges) execSync('git stash pop', { cwd: ROOT, stdio: 'pipe' }).toString();
  } catch {
    console.error(chalk.red('  ' + t.pullFailed));
    process.exit(1);
  }
  console.log(chalk.dim('  ' + t.pullDone));

  console.log(chalk.dim('  ' + t.installingDeps));
  try {
    execSync('npm ci', { cwd: ROOT, stdio: 'inherit' });
  } catch {
    console.error(chalk.red('  ' + t.depsFailed));
    process.exit(1);
  }
  console.log(chalk.dim('  ' + t.depsDone));

  await restartWithBuild(t.updateDone);
}

if (arg === 'stop') {
  const stopped = stopServices();
  if (stopped) console.log(chalk.green('  ' + t.servicesStopped));
  else console.log(chalk.yellow('  ' + t.noServicesFound));
  process.exit(0);
}

if (arg === 'status') {
  const status = await getServiceStatus();
  const icon = (ready) => ready ? chalk.green('●') : chalk.red('●');
  const label = (running, ready) => {
    if (!running) return chalk.red(t.stateNotRunning);
    if (!ready) return chalk.yellow(t.stateRunningNotReady);
    return chalk.green(t.stateRunningReady);
  };

  console.log();
  console.log(chalk.bold('  ' + t.statusTitle));
  console.log(chalk.dim('  ─────────────────────────────────────'));
  console.log(`  ${icon(status.server.ready)} Server ${chalk.dim(':' + SERVER_PORT)}  ${label(status.server.running, status.server.ready)}`);
  console.log(chalk.dim(`    PID: ${status.server.pids.length ? status.server.pids.join(', ') : '-'}`));
  console.log(`  ${icon(status.apps.ready)} Apps   ${chalk.dim(':' + APPS_PORT)}  ${label(status.apps.running, status.apps.ready)}`);
  console.log(chalk.dim(`    PID: ${status.apps.pids.length ? status.apps.pids.join(', ') : '-'}`));
  console.log(chalk.dim('  ─────────────────────────────────────'));
  console.log();
  process.exit(status.server.ready && status.apps.ready ? 0 : 1);
}

if (arg === 'uninstall') {
  await runUninstall();
}

if (arg) {
  console.error(chalk.red('  ' + t.unknownCommand(arg)));
  console.log(chalk.dim('  ' + t.runHelp));
  process.exit(1);
}

// default: interactive chat
startChat();
