const appLoaders = [
  () => import("./notebook/index.js"),
  () => import("./finance/index.js"),
  () => import("./cryptobot/index.js"),
  () => import("./ghtrending/index.js"),
  () => import("./createapp/index.js"),
  () => import("./claude-code/index.js"),
  () => import("./codex/index.js")
];
export {
  appLoaders
};
