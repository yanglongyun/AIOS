import { buildFrontend, restartAppsProcess, scheduleServerRestart } from "../../system/reload.js";
const runReload = async (build, restart) => {
  if (build) {
    buildFrontend();
  }
  if (restart === "apps" || restart === "both") {
    await restartAppsProcess();
  }
  return restart === "server" || restart === "both";
};
const restartServerAfterResponse = async () => {
  await scheduleServerRestart();
};
export {
  restartServerAfterResponse,
  runReload
};
