import { buildFrontend, restartAppsProcess } from "../../system/reload.js";
const runReload = async (build, restart) => {
  if (build) {
    buildFrontend();
  }
  if (restart === "apps") {
    await restartAppsProcess();
  }
  return false;
};
export {
  runReload
};
