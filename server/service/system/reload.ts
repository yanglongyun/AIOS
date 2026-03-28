import { buildFrontend, restartAppsProcess, scheduleServerRestart } from '../../system/reload.ts';

type ReloadTarget = 'server' | 'apps' | 'both' | null;

export const runReload = async (build: boolean, restart: ReloadTarget) => {
  if (build) {
    buildFrontend();
  }

  if (restart === 'apps' || restart === 'both') {
    await restartAppsProcess();
  }

  return restart === 'server' || restart === 'both';
};

export const restartServerAfterResponse = async () => {
  await scheduleServerRestart();
};
