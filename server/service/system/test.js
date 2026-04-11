import { buildFrontend, probeProcess } from "./reload.js";

const runReloadTest = async (build, restartApps, restartServer) => {
  if (build) {
    buildFrontend();
  }
  if (restartApps) {
    await probeProcess("apps/index.js", 9511, "/apps/health");
  }
  if (restartServer) {
    await probeProcess("server/index.js", 9510, "/api/health");
  }
  return true;
};

export {
  runReloadTest
};
