const appLoaders = [
  () => import("./notebook/index.js"),
  () => import("./finance/index.js"),
  () => import("./subscriber/index.js"),
  () => import("./cryptobot/index.js"),
  () => import("./reader/index.js"),
  () => import("./fortune/index.js"),
  () => import("./poker/index.js"),
  () => import("./banana/index.js"),
  () => import("./openclaw/index.js"),
  () => import("./createapp/index.js")
];
export {
  appLoaders
};
